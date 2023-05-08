const posts = Vue.component('posts', {
    template: `
    <div class="post-item" align="center"> 
    <h5 class="post-header" style="width: 20%; border: none; text-align: center;"><u> <b><a href="/profile_page/{{post['user_no']}}"> {{ post_user }}  </a></b></u>
							</h5>
    <p> {{post['post_title']}} </p>
	<p align="right"> <b>created/modified on: </b>{{ post['post_updated_ts'] }}   </p>
	<div class="row">
		<div class="col-md-10">
		<div class="post_desc_grid"> 
		{% if post['image_url'] %}
			<img src="../static/{{post['image_url']}}" width="350" height="250" class="post_img"> 
		{% endif %}
		<div class="post_desc" style="padding: 10px;"> {{post['description']}}  </div>
		</div>
		<div class="post_desc_grid" style="width: 90%"> Comments:&emsp;     
        </div>
    </div>
    </div>                   
`,

    data() {
        return {
            formdata: {
                user_name: '',
                password: '',
            },
            success: false,
            message: '',
        }
    },
    methods: {
        loginUser() {
            this.success = false;
            console.log(this.formdata.user_name, this.formdata.password)
            if ( this.formdata.user_name == "test" && this.formdata.password == "password") {
                this.success = true;
                this.message = "";
                console.log("Success!!!", this.success, this.message);
            }
            if(!this.success){
                console.log(this.success, this.message);
                this.message = "Wrong Username or password";
            }
        },
    }
})

export default posts;