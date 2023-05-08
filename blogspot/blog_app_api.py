import datetime
import os
import workers
import tasks
import pandas as pd

from flask import Flask, render_template, request, send_file
from flask_cors import CORS
from flask_restful import Resource, Api
from flask_restful import reqparse
from flask_security import UserMixin, RoleMixin, auth_required, current_user
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Index
from flask_caching import Cache
from flask_security import Security, SQLAlchemyUserDatastore

current_dir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///" + os.path.join(current_dir, "blog.db")
app.config['SECRET_KEY'] = "mysecretkeyforblog"
app.config['SECURITY_PASSWORD_HASH'] = 'bcrypt'
app.config['SECURITY_PASSWORD_SALT'] = 'saltsecret'
app.config['WTF_CSRF_ENABLED'] = False
app.config['SECURITY_TOKEN_AUTHENTICATION_HEADER'] = "Authentication-Token"
app.config['CELERY_BROKER_URL']="redis://localhost:6379/1"
app.config['CELERY_RESULT_BACKEND']="redis://localhost:6379/2"
app.config['CELERY_TIMEZONE'] = 'Asia/Kolkata'
app.config['enable_utc'] = False
app.config['CACHE_TYPE'] = "RedisCache"
app.config['CACHE_REDIS_HOST'] = "localhost"
app.config['CACHE_REDIS_PORT'] = 6379

CORS(app)
db = SQLAlchemy()
db.init_app(app)
api = Api(app)
cache=Cache(app)
app.app_context().push()

celery = workers.celery
celery.conf.update(
    broker_url = app.config["CELERY_BROKER_URL"],
    result_backend = app.config["CELERY_RESULT_BACKEND"],
    timezone='Asia/Kolkata',
    enable_utc=False
)
celery.Task = workers.ContextTask

roles_users = db.Table('roles_users', db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
                                      db.Column('role_id', db.Integer(), db.ForeignKey('role.id')))

class User(db.Model, UserMixin):
    __tablename__ = 'user'
    id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    profile_image = db.Column(db.String)
    active = db.Column(db.Boolean())
    fs_uniquifier = db.Column(db.String(255), unique=True, nullable=False)
    report_format = db.Column(db.String)
    roles = db.relationship('Role', secondary=roles_users, backref=db.backref('users', lazy='dynamic'))
    user_posts = db.relationship('Posts', backref="author", cascade="all, delete")
    Index("idx_user_username", username)

class Role(db.Model,RoleMixin):
    id=db.Column(db.Integer(),primary_key=True)
    name = db.Column(db.String(80),unique=True)
    description= db.Column(db.String(255))


class Posts(db.Model):
    __tablename__ = 'posts'
    post_id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    post_title = db.Column(db.String, unique=True, nullable=False)
    description = db.Column(db.String)
    image_url = db.Column(db.String)
    post_created_ts = db.Column(db.DateTime, nullable=False)
    likes = db.Column(db.Integer)
    dislikes = db.Column(db.Integer)
    user_no = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_updated_ts = db.Column(db.DateTime)
    post_comments = db.relationship('Comments', backref='post', cascade="all, delete")


class Followers(db.Model):
    __tablename__ = 'followers'
    user_no = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, primary_key=True)
    following_user = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)


class Comments(db.Model):
    __tablename__ = 'comments'
    comment_id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    comment_text = db.Column(db.String)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.post_id'))
    user_name = db.Column(db.String, db.ForeignKey('user.username'))

# for flask security usage
user_datastore = SQLAlchemyUserDatastore(db,User,Role)
sec = Security()
sec.init_app(app,user_datastore)

user_parser = reqparse.RequestParser()
user_parser.add_argument("username")
user_parser.add_argument("email")
user_parser.add_argument("password")
user_parser.add_argument("repassword")
user_parser.add_argument("image_path")
user_parser.add_argument("uniquifier")

post_parser = reqparse.RequestParser()
post_parser.add_argument("post_title")
post_parser.add_argument("description")
post_parser.add_argument("post_user")
post_parser.add_argument("post_likes")
post_parser.add_argument("post_dislikes")
post_parser.add_argument("image")

comment_parser = reqparse.RequestParser()
comment_parser.add_argument("comment_text")

follow_parser = reqparse.RequestParser()
follow_parser.add_argument("curr_user")
follow_parser.add_argument("follow_user")

import_parser = reqparse.RequestParser()
import_parser.add_argument("import_file")

@app.before_first_request
def create_db():
    db.create_all()

@app.route("/")
def user_login():
    print("Welcome")
    return render_template("index.html")

class UserLogin(Resource):
    @auth_required("token")
    def get(self):
        data = {
                "user_id": current_user.id,
                "user_name": current_user.username,
                "email": current_user.email,
                "image": current_user.profile_image
                }
        print(data)
        return data, 200

class SearchAPI(Resource):
    @cache.cached(timeout=20)
    @auth_required("token")
    def get(self, user_name):
        print('user_name : ', user_name)
        try:
            if(user_name is None):
                name = '%'
            else:
                name = '%' + user_name + '%'
            print('name: ', name)
            srch_user = User.query.filter(User.username.like(name)).filter(User.id != current_user.id).order_by(User.username).all()
            # print(srch_user)
            l = len(srch_user)
            user_list = []
            if(l==0):
                return user_list, 400
            else:
                for user in srch_user:
                    data = {
                        "user_id": user.id,
                        "user_name": user.username
                    }
                    user_list.append(data)
                return user_list, 200
        except:
            return 'Internal Server Error', 500

class UserAPI(Resource):
    @auth_required("token")
    def get(self, user_id):
        print('USerAPI GET')
        try:
            u1 = User.query.get(user_id)
            print("Welcome - ", user_id)
            if u1 is None:
                return 'User not found', 404
            else:
                followers_list = Followers.query.filter(Followers.following_user == user_id).all()
                fl1 = []
                print('getting follower details')
                for f1 in followers_list:
                    usr = User.query.get(f1.user_no)
                    data = {
                        "user_id": f1.user_no,
                        "user_name": usr.username
                    }
                    fl1.append(data)
                # print('followers: ', fl1)
                following_list = Followers.query.filter(Followers.user_no == user_id).all()
                fl2 = []
                for f1 in following_list:
                    usr = User.query.get(f1.following_user)
                    data = {
                        "user_id": f1.following_user,
                        "user_name": usr.username
                    }
                    fl2.append(data)
                data = {
                    "user_id": u1.id,
                    "user_name": u1.username,
                    "email": u1.email,
                    "followers_count": len(followers_list),
                    "following_count": len(following_list),
                    "followers_list": fl1,
                    "following_list": fl2,
                    "report_format": u1.report_format
                }
                print('User GET - ', data)
                return data, 200
        except:
            return 'Internal Server Error', 500

    @auth_required("token")
    def put(self, user_id):
        print('USerAPI PUT')
        args = user_parser.parse_args()
        email = args.get("email", None)
        password = args.get("password", None)
        image = args.get("image_path", None)
        print('put: ', email, password)

        if email is None:
            data = {'error_code': "USER002", 'error_message': "Email is required."}
            return data, 400
        elif ('@' not in email) or ('.' not in email):
            data = {'error_code': "USER003", 'error_message': "Invalid Email."}
            return data, 400
        elif len(password) < 8:
            data = {'error_code': "USER004", 'error_message': "Password should be minimum 8 characters."}
            return data, 400
        else:
            try:
                u1 = User.query.get(user_id)
                if u1 is None:
                    return 'User not found', 404
                else:
                     mail = db.session.query(User).filter(User.email == email).filter(User.id != user_id).first()
                     if (mail is not None):
                         data = {'error_code': "USER006",
                                 'error_message': "Email already exists!"}
                         return data, 400
                     u1.email = email
                     if(image is not None):
                         u1.profile_image = image
                     db.session.commit()
                     data = {
                         "user_id": u1.id,
                         "user_name": u1.username,
                         "email": u1.email,
                         "image": u1.profile_image,
                         "report_format": u1.report_format
                     }
                     return data, 200
            except:
                return 'Internal Server Error', 500

    @auth_required("token")
    def delete(self, user_id):
        print('USerAPI DELETE')
        print('delete user')
        try:
            # user_datastore.delete_user()
            u1 = User.query.get(user_id)
            if u1 is None:
                return 'User not found', 404
            else:
                c1 = Comments.query.filter(Comments.user_name == u1.username).all()
                print('comments from delete: ', c1)
                for c in c1:
                    db.session.delete(c)
                followers_list = db.session.query(Followers).filter(Followers.user_no == user_id).all()
                if len(followers_list) > 0:
                    for f1 in followers_list:
                        db.session.delete(f1)
                followers_list = db.session.query(Followers).filter(Followers.following_user == user_id).all()
                if len(followers_list) > 0:
                    for f1 in followers_list:
                        db.session.delete(f1)
                db.session.delete(u1)
                db.session.commit()
                return "Successfully Deleted", 200
        except:
            return 'Internal Server Error', 500

    def post(self):
        print('USerAPI POST')
        try:
            user_data = request.json
            print('input: ', user_data)
            output = user_datastore.create_user(**user_data)
            print(output.username, output.email)
            db.session.commit()
            data = {
                "id": output.id,
                "username": output.username,
                "email": output.email,
                "profile_image": output.profile_image,
                "report_format": output.report_format
            }
            return data, 200
        except:
            print('Exception')
            return 'Internal Server Error', 500

class PostAPI(Resource):
    @cache.cached(timeout=20)
    @auth_required("token")
    def get(self, post_id):
        try:
            p1 = Posts.query.filter(Posts.post_id == post_id).first()
            print('GET: ', post_id, p1)
            if p1 is None:
                return 'Post Not Found', 404
            else:
                comment_list = []
                comments = Comments.query.filter(Comments.post_id == p1.post_id).all()
                for c in comments:
                    comment_list.append({
                        "comment": c.comment_text,
                        "user": c.user_name,
                        "comment_id": c.comment_id,
                        "post_id": c.post_id
                    })
                data = {"post_title": p1.post_title,
                        "description": p1.description,
                        "creted_time": str(p1.post_created_ts),
                        "likes": p1.likes,
                        "dislikes": p1.dislikes,
                        "post_user": p1.user_no,
                        "updated_time": str(p1.post_updated_ts),
                        "comments": comment_list
                        }
                print('Posts GET output: ', data)
                return data, 200
        except:
            return 'Internal Server Error', 500

    @auth_required("token")
    def put(self, post_id):
        try:
            args = post_parser.parse_args()
            title = args.get("post_title", None)
            desc = args.get("description", None)
            post_user = args.get("post_user", None)
            post_likes = args.get("post_likes", None)
            post_dislikes = args.get("post_dislikes", None)
            image_name = args.get("image", None)

            if title is None:
                print('No title')
                data = {'error_code': "POST001", 'error_message': "Post Title is required."}
                return data, 400
            elif post_user is None:
                print('No user')
                data = {'error_code': "POST002", 'error_message': "User id is required."}
                return data, 400
            else:
                print('POST PUT: ', post_id, post_user)
                # db.session.query(Posts).filter(Posts.user_no == user_id)
                p1 = Posts.query.filter(Posts.post_id == post_id).first()
                if p1 is None:
                    return 'Post not found', 404
                else:
                    if (int(p1.user_no) != int(post_user)):
                        print('not equal')
                        data = {'error_code': "POST003", 'error_message': "Post not created by user"}
                        return data, 400
                    current_timestamp = datetime.datetime.now()
                    print(current_timestamp)
                    print('likes, & dislikes: ', post_likes, post_dislikes)
                    print('title: ', title)
                    if(title is not None):
                        p1.post_title = title
                    if desc is not None:
                        p1.description = desc
                    p1.post_updated_ts = current_timestamp
                    # p1.post_user = post_user
                    if image_name is not None:
                        p1.img_src = image_name
                    if(post_likes != None):
                        if(int(post_likes) > 0):
                            p1.likes = int(post_likes)
                    else:
                        p1.likes = 0
                    if(post_dislikes != None):
                        if(int(post_dislikes) > 0):
                            p1.dislikes = int(post_dislikes)
                    else:
                        p1.dislikes = 0
                    db.session.commit()
                    data = {"post_id": p1.post_id,
                            "post_title": p1.post_title,
                            "description": p1.description,
                            "likes": p1.likes,
                            "dislikes": p1.dislikes,
                            "updated_ts": str(p1.post_updated_ts)
                            }
                    print('Posts put output: ', data)
                    return data, 200
        except:
            return 'Internal Server Error', 500

    @auth_required("token")
    def delete(self, post_id):
        print('delete post')
        try:
            p1 = Posts.query.get(post_id)
            if p1 is None:
                return 'Post not found', 404
            else:
                db.session.delete(p1)
                db.session.commit()
                return "Successfully Deleted", 200
        except:
            return 'Internal Server Error', 500

    @auth_required("token")
    def post(self):
        try:
            current_timestamp = datetime.datetime.now()
            args = post_parser.parse_args()
            title = args.get("post_title", None)
            desc = args.get("description", None)
            post_user = args.get("post_user", None)
            image_path = args.get("image", None)

            if title is None:
                data = {'error_code': "POST001", 'error_message': "Post Title is required."}
                return data, 400
            elif post_user is None:
                data = {'error_code': "POST002", 'error_message': "User id is required."}
                return data, 400
            else:
                p1 = db.session.query(Posts).filter(Posts.post_title == title).first()
                print('post create :', p1)
                if p1 is None:
                    new_post = Posts(post_title=title, description=desc,likes=0, dislikes=0,
                                     post_created_ts=current_timestamp, post_updated_ts=current_timestamp,
                                     user_no=post_user, image_url=image_path)
                    print("test1")
                    db.session.add(new_post)
                    db.session.commit()
                    print(new_post.post_title)
                    data = {"post_id": new_post.post_id,
                            "post_title": new_post.post_title,
                            "description": new_post.description,
                            "post_user": new_post.user_no,
                            "post_created_time": str(new_post.post_created_ts)
                            }
                    return data, 201
                else:
                    return 'Post title already exist', 409
        except:
            return 'Internal Server Error', 500


class FeedAPI(Resource):
    @auth_required("token")
    def get(self, user_id):
        print('FEED GET', user_id)
        try:
            u1 = User.query.get(user_id)
            if u1 is None:
                return 'User Not Found', 404
            else:
                feed_data = []
                following_list = Followers.query.filter(Followers.user_no == user_id).all()
                if (len(following_list) == 0):
                    data = {'error_code': "FEED001", 'error_message': "User Not following anyone."}
                    return data, 400
                else:
                    for item in following_list:
                        list1 = Posts.query.filter(Posts.user_no == item.following_user).order_by(
                            Posts.post_updated_ts.desc()).all()

                        for post in list1:
                            comment_list = []
                            comments = Comments.query.filter(Comments.post_id == post.post_id).all()
                            for c in comments:
                                comment_list.append({
                                    "comment_id": c.comment_id,
                                    "comment": c.comment_text,
                                    "user": c.user_name,
                                    "post_id": c.post_id
                                })
                            print("post comments: ", post.post_comments)
                            user = User.query.get(post.user_no)
                            data = {"post_id": post.post_id,
                                    "post_title": post.post_title,
                                    "description": post.description,
                                    "creted_time": str(post.post_created_ts),
                                    "likes": post.likes,
                                    "dislikes": post.dislikes,
                                    "post_user": post.user_no,
                                    "updated_time": str(post.post_updated_ts),
                                    "post_username": user.username,
                                    "post_image": post.image_url,
                                    "comments": comment_list
                                    }
                            feed_data.append(data)
                    print('feed output: ', feed_data)
                    return feed_data, 200
        except:
            return 'Internal Server Error', 500


class CommentsAPI(Resource):
    @cache.cached(timeout=20)
    @auth_required("token")
    def get(self, post_id):
        print('GET comments ', post_id)
        try:
            cmnt = Comments.query.filter(Comments.post_id == post_id).all()
            if cmnt is None:
                return 'No Comments Found for the post', 404
            else:
                comment_list = []
                for c in cmnt:
                    comment_list.append({
                        "comment_id": c.comment_id,
                        "comment": c.comment_text,
                        "user": c.user_name,
                        "post_id": post_id
                    })
            data = {"post_id": post_id,
                    "comments": comment_list
                    }
            return data, 200
        except:
            return 'Internal Server Error', 500

    @auth_required("token")
    def post(self, user_id, post_id):
        args = comment_parser.parse_args()
        comment = args.get("comment_text", None)
        print('POST comment:', comment)
        print('user, post: ', user_id, post_id)
        try:
            u1 = User.query.get(user_id)
            p = Posts.query.get(post_id)
            if u1 is None:
                return 'User Not Found', 404
            if p is not None:
                print('post exists', p.post_id)
                post_title = p.post_title
                desc = p.description
                likes = p.likes
                dislikes = p.dislikes
                post_user = p.user_no
                updated_ts = p.post_updated_ts

                new_comment = Comments(comment_text=comment, post_id=post_id, user_name=u1.username)
                db.session.add(new_comment)
                db.session.commit()
                print('comment added succesfully', u1.username)
                comment_list = []
                comments = Comments.query.filter(Comments.post_id == post_id).all()
                for c in comments:
                    comment_list.append({
                        "comment_id": c.comment_id,
                        "comment": c.comment_text,
                        "user": c.user_name,
                        "post_id": c.post_id
                    })
                    print(c.user_name)
                data = {"post_title": post_title,
                        "description": desc,
                        "likes": likes,
                        "dislikes": dislikes,
                        "post_user": post_user,
                        "updated time": str(updated_ts),
                        "comments": comment_list
                        }
                print('POST Comments output: ', data)
                return data, 201
            else:
                data = {'error_code': "FEED002", 'error_message': "Wrong post_id."}
                return data, 400
        except:
            return 'Internal Server Error', 500


class DelCommentAPI(Resource):
    @auth_required("token")
    def delete(self, comment_id):
        print('delete of comment', comment_id)
        try:
            c = Comments.query.get(comment_id)
            if c is None:
                return 'Comment not found', 404
            else:
                db.session.delete(c)
                db.session.commit()
                return "Successfully Deleted", 200
        except:
            return 'Internal Server Error', 500

class ProfileAPI(Resource):
    @cache.cached(timeout=20)
    @auth_required("token")
    def get(setf, user_id, username):
        print('Profile of: ', user_id)
        try:
            u1 = User.query.get(user_id)
            if u1 is None:
                return 'User not found', 404
            else:
                posts = Posts.query.filter(Posts.user_no == user_id).order_by(
                            Posts.post_updated_ts.desc()).all()
                post_list = []
                if posts is None:
                    return 'No posts for the current user', 400
                else:
                    comments_list = []
                    for post in posts:
                        cmnts = Comments.query.filter(Comments.post_id == post.post_id)
                        for c in cmnts:
                            c1 = {
                                "comment_id": c.comment_id,
                                "comment": c.comment_text,
                                "user": c.user_name,
                                "post_id": c.post_id
                            }
                            comments_list.append(c1)
                        data = {"post_id": post.post_id,
                                "post_title": post.post_title,
                                "description": post.description,
                                "likes": post.likes,
                                "dislikes": post.dislikes,
                                "post_user": post.user_no,
                                "post_username": u1.username,
                                "post_image": post.image_url,
                                "updated_time": str(post.post_updated_ts),
                                "comments": comments_list
                                }
                        print('Profile output: ', data)
                        post_list.append(data)
                    return post_list, 200
        except:
            return 'Internal Server Error', 500

class FollowAPI(Resource):
    @auth_required("token")
    def post(setf, user_id):
        print("FollowAPI POST")
        print('Profile of: ', user_id)
        try:
            args = follow_parser.parse_args()
            curr_user = args.get("curr_user", None)
            follow_user = args.get("follow_user", None)
            print(curr_user, follow_user)
            if(curr_user != follow_user):
                u1 = User.query.get(user_id)
                if u1 is None:
                    return 'User not found', 404
                else:
                    temp = Followers.query.filter(Followers.following_user == follow_user).filter(Followers.user_no == user_id).first()
                    print('current follow: ', temp)
                    if (not temp):
                        new_follow = Followers(user_no=user_id, following_user=follow_user)
                        db.session.add(new_follow)
                        db.session.commit()
                        return 'successful', 200
                    else:
                        return 'already following', 200
        except:
            return 'Internal Server Error', 500

class UnfollowAPI(Resource):
    @auth_required("token")
    def delete(setf, user_id):
        print("FollowAPI DELETE")
        print('Profile of: ', user_id)
        try:
            args = follow_parser.parse_args()
            curr_user = args.get("curr_user", None)
            follow_user = args.get("follow_user", None)
            print(curr_user, follow_user)
            u1 = User.query.get(user_id)
            if u1 is None:
                return 'User not found', 404
            else:
                follow1 = Followers.query.filter(Followers.following_user == follow_user).filter(
                    Followers.user_no == user_id).first()
                print('followers: ', follow1)
                if (follow1):
                    db.session.delete(follow1)
                    db.session.commit()
                    return 'successful', 200
                else:
                    return 'already unfollowing', 200
        except:
            return 'Internal Server Error', 500


class Export(Resource):
    @auth_required("token")
    def get(self):
        print("Inside export path")
        user_id = current_user.id
        job = tasks.export_posts.delay(user_id)
        result = job.wait()
        if(result == "completed"):
            path = 'User{}_posts.csv'.format(user_id)
            return send_file(path, as_attachment=True)
            # return "Posts exported successfully"
        else:
            return "error", 400

class Import(Resource):
    @auth_required("token")
    def post(self):
        count = 0
        print("Inside import path")
        user_id = current_user.id
        args = import_parser.parse_args()
        import_file = args.get("import_file", None)
        print('file name: ', import_file)
        file = pd.read_csv(import_file)
        print('Posts from file:')
        for index, post in file.iterrows():
            # print('post: ', post.post_title)
            print('index: ', index)
            current_timestamp = datetime.datetime.now()
            p1 = db.session.query(Posts).filter(Posts.post_title == post.post_title).first()
            # print('post create :', count)
            if p1 is None:
                new_post = Posts(post_title=post.post_title, description=post.description, likes=post.likes, dislikes=post.dislikes,
                             post_created_ts=current_timestamp, post_updated_ts=current_timestamp,
                             user_no=user_id, image_url=post.image_url)
                print("post count: ", count)
                db.session.add(new_post)
                db.session.commit()
                count += 1
        if(count > 0):
            data = {
                "message": "posts uploded succesfully",
                "count: ": count
            }
        else:
            data = {
                "message": "Duplicate post titles",
                "count: ": count
            }
        return data, 201

api.add_resource(UserLogin, "/api/user_login" )
api.add_resource(UserAPI, "/api/user", "/api/user/<int:user_id>")
api.add_resource(PostAPI, "/api/post", "/api/post/<int:post_id>")
api.add_resource(FeedAPI, "/api/feeds/<int:user_id>")
api.add_resource(CommentsAPI, "/api/comments/<int:post_id>", "/api/comments/<int:user_id>/<int:post_id>")
api.add_resource(DelCommentAPI, "/api/delcomment/<int:comment_id>")
api.add_resource(SearchAPI, "/api/search/<string:user_name>")
api.add_resource(ProfileAPI, "/api/profile/<int:user_id>/<string:username>")
api.add_resource(FollowAPI, "/api/follow/<int:user_id>")
api.add_resource(UnfollowAPI, "/api/unfollow/<int:user_id>")
api.add_resource(Export, "/api/export")
api.add_resource(Import, "/api/import")


if __name__ == '__main__':
    app.debug = True
    app.run()
