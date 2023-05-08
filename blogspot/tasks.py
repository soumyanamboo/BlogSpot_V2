from workers import celery
import datetime as dt
from datetime import datetime
from celery.schedules import crontab
from jinja2 import Template
from weasyprint import HTML
import pandas as pd
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders


SMPTP_SERVER_HOST = "localhost"
SMPTP_SERVER_PORT = 1025
SENDER_ADDRESS = "support@blogspot.com"
SENDER_PASSWORD = ""

@celery.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(crontab(0,20), daily_report.s(), name='Daily User report at 10:00 PM')
    sender.add_periodic_task(crontab(1, 0, 1), monthly_report.s(), name='Monthly User Report of BlogSopt')
    # sender.add_periodic_task(crontab(51, 11), daily_report.s(), name='Daily User report at 10:00 PM')
    # sender.add_periodic_task(crontab(48, 11), monthly_report.s(), name='Monthly User Report of BlogSopt')


@celery.task()
def export_posts(userid):
    from blog_app_api import db, Posts
    print('Inside export task')
    f = open('User{}_posts.csv'.format(userid), 'w')
    posts = Posts.query.filter(Posts.user_no == userid).all()
    post_list = []
    for post in posts:
        comments_list = []
        for c1 in post.post_comments:
            comment = {
                "comment_text": c1.comment_text,
                "user_name": c1.user_name
            }
            comments_list.append(comment)
        data = {
            "post_id": post.post_id,
            "post_title": post.post_title,
            "description": post.description,
            "image_url": post.image_url,
            "post_created_ts": post.post_created_ts,
            "likes": post.likes,
            "dislikes": post.dislikes,
            "user_no": post.user_no,
            "post_updated_ts": post.post_updated_ts,
            "post_comments": comments_list
        }
        post_list.append(data)
    print("Posts created by User ", userid, ': ', post_list)
    df = pd.DataFrame(post_list)
    df.to_csv('User{}_posts.csv'.format(userid))
    print('Exported file: User{}_posts.csv'.format(userid))
    return "completed"

@celery.task()
def daily_report():
    from blog_app_api import db, Posts, User
    today = dt.date.today()

    users = User.query.all()
    for u1 in users:
        modified = False
        print('User: ', u1.username)
        posts = Posts.query.filter(Posts.user_no == u1.id).all()
        # print('Posts: ', posts)
        for p1 in posts:
            post_last_updated = p1.post_updated_ts.date()
            if(post_last_updated == today):
                modified = True
        if(not modified):
            print('{} have not created / updated any posts today'.format(u1.username))
            user_name = u1.username
            email = u1.email
            subject = 'Blogsppt - Daily Reminder'
            to_address = email
            with open('daily_report.html') as report:
                template = Template(report.read())
                message=template.render(user=user_name)
                print(message)
                send_email(to_address, subject, message, attachment_file=None)
    return "job completed"


@celery.task()
def monthly_report():
    from blog_app_api import db, Posts, User, Followers
    today = dt.date.today()
    yesterday = today - dt.timedelta(days=1)
    prev_month_day1 = yesterday.replace(day=1)
    prev_month = yesterday.strftime('%B')
    users = User.query.all()
    for u1 in users:
        print('User: ', u1.username)
        posts = Posts.query.filter(Posts.user_no == u1.id).filter(Posts.post_updated_ts >= prev_month_day1).all()
        post_count = len(posts)
        followers_list = Followers.query.filter(Followers.following_user == u1.id).all()
        f1 = len(followers_list)
        following_list = Followers.query.filter(Followers.user_no == u1.id).all()
        f2 = len(following_list)
        name = u1.username
        email = u1.email
        report_format = u1.report_format
        print('User report format: ', report_format)
        post_list = []
        for p1 in posts:
            post = {
                "title": p1.post_title,
                "likes": p1.likes,
                "dislikes": p1.dislikes,
                "comment_count": len(p1.post_comments)
            }
            post_list.append(post)
        subject = 'BlogSpot - Monthly User Activity Report'
        to_address = email

        with open('monthly_report.html') as report:
            template = Template(report.read())
            message=template.render(user=name, post_count=post_count, followers_count=f1, following_count=f2,
                                    post_list=post_list, month=prev_month)
            if (report_format == 'pdf'):
                html = HTML(string=message)
                file_name = ("{}.pdf".format(name))
                html.write_pdf(target=file_name)
                print('filename: ', file_name)
            else:
                print('attachment in HTML format')
                file_name = ("{}.html".format(name))
                f = open(file_name, "w")
                f.write(message)
                f.close()
        send_email(to_address, subject, message, attachment_file=file_name)
    return "job completed"

@celery.task()
def send_email(to_address,subject,message,attachment_file=None):
    print('inside send mail function')
    msg = MIMEMultipart()
    msg["From"] = SENDER_ADDRESS
    msg["To"] = to_address
    msg["Subject"] = subject
    msg.attach(MIMEText(message,"html"))
    if attachment_file:
        with open(attachment_file,"rb") as attachment:
            part = MIMEBase("application" , "octet-stream")
            part.set_payload(attachment.read())
        encoders.encode_base64(part)
        part.add_header(
            "Content-Disposition" , f"attachment; filename = {attachment_file}",
        )
        msg.attach(part)

    s= smtplib.SMTP(host=SMPTP_SERVER_HOST, port=SMPTP_SERVER_PORT)
    s.login(SENDER_ADDRESS,SENDER_PASSWORD)
    text = msg.as_string()
    s.sendmail(SENDER_ADDRESS, to_address, text)
    s.quit()
    return True