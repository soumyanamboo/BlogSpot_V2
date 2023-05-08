import sidebar from './sidebar.js'
import navigations from './navigations.js';

const update_post = Vue.component('update_post', {
    template: `
    <div class="container">
        <div class="header">
            <div class="h-left"> <img src="../static/header1.jpg" width="300" height="150"></div>
            <div class="h-middle" align="left"><h1>BlogSpot</h1>                    
                <p>Freedom of Expression...</p> </div>			
            <div class="h-right"> <navigations></navigations> </div>
        </div>
        <div class="middle" align="center">
			<div class="row">
				<div class="col-md-3">
					<sidebar></sidebar>
				</div>
				<div class="col-md-9" style="padding: 50px;">
                    <h5 align="left"><b> Update Blog / Post : </b></h5> <br> 
                    <div style="color: red;" v-if="err_code!=0" align="left"> {{err_message}} </div> <br>
					<form  action="" id="update_post">
                        <div class="row">
                            <div class="col-md-2"> <label>Title: </label> </div>
                            <div class="col-md-10" align="left"> <input type="text" name="title" placeholder="Post Title" v-model="formdata.post_title"> </div>
                        </div><br>
                        <div class="row">
                            <div class="col-md-2"> <label>Description: </label> </div>
                            <div class="col-md-10" align="left"> <textarea id="desc" name="desc" rows="5" cols="100" placeholder="Post Description" v-model="formdata.description"></textarea> </div>
                        </div><br>
                        <div class="row">
                            <div class="col-md-2"> <label>Image Upload: </label> </div>
                            <div class="col-md-10" align="left"> <input type="file" id="imgupload" name="img_name" accept="image/*"> </div>
                        </div><br>
                        <div class="row">  
                            <div class="col-md-1"> </div>
                            <div class="col-md-2">
                                <button type="submit" @click.prevent="updatePost" class="btn btn-success" name="updatepost" style="margin-right: 25px; margin-left: 50px;"> Submit </button>
                            </div>
                            <div class="col-md-2">
                                <button @click="cancel" class="btn btn-primary" style="margin-left: 25px; color: white;"> Cancel </button>
                            </div>                            
                        </div>
                    </form>
				</div>
			</div>
		</div>
    </div>
    `,
    data() {
        return {
            formdata: {
                post_title: '',
                description: '',
                image: '',
                post_user: '',
                post_action: ''
            },
            err_message: '',
            err_code: 0,
        }
    },
    methods: {
        async updatePost(){
            console.log('Title: ', this.formdata.post_title)
            if(this.formdata.post_title.trim() > ''){
                let image_name = document.getElementById('imgupload');
                if (image_name.value > '') {
                    this.formdata.image = image_name.files.item(0).name;
                    console.log('image_path: ', this.formdata.image) 
                }
                this.formdata.post_user = localStorage.getItem('userid');
                console.log('Post user: ', this.formdata.post_user)
                fetch(`/api/post/${this.$route.params.post_id}` , {
                    headers:{
                        'Content-Type': 'application/json',
                        'Authentication-Token':localStorage.getItem('auth-token'),
                    },
                    method: 'put',
                    body: JSON.stringify(this.formdata),
                }).then((resp) => {
                    console.log('Status: ', resp.status)
                    if(resp.status >= 400 && resp.status <= 600){
                        if(resp.status == 400){
                            throw new Error("Post not created by user!!");
                        }
                        else if(resp.status == 401){
                            localStorage.clear();
                            this.$router.push('/');
                        }
                        else{
                            throw new Error("Something went wrong!!");
                        }                        
                    }                    
                    return resp.json();
                }).then((data) => {
                    let userid = localStorage.getItem('userid');
                    let username = localStorage.getItem('username');
                    console.log('Post updated', data.post_id)
                    this.$router.push(`/profile/${userid}/${username}`);
                }).catch((err) => {
                    console.log("Error: ", err)
                })
            }
            else{
                this.err_code = 2;
                this.err_message = "Title cannot be empty"
            }
        },
        cancel(){
            let userid = localStorage.getItem('userid');
            let username = localStorage.getItem('username');
            this.$router.push(`/profile/${userid}/${username}`);
        },
    },
    async mounted() {
        this.user_id = localStorage.getItem('userid');
        if(!this.user_id){
            console.log('User not logged in')
            this.$router.push('/');
        }
        else{
            console.log("Update post id: ", this.$route.params.post_id)
            fetch(`/api/post/${this.$route.params.post_id}` , {
                headers:{
                    'Content-Type': 'application/json',
                    'Authentication-Token':localStorage.getItem('auth-token'),
                },
            }).then((resp) => {
                console.log('Status: ', resp.status)
                if(resp.status >= 400 && resp.status <= 600){
                    if(resp.status == 400){
                        throw new Error("Post not created by user!!");
                    }
                    else if(resp.status == 401){
                        localStorage.clear();
                        this.$router.push('/');
                    }
                    else{
                        throw new Error("Something went wrong!!");
                    }                        
                }                    
                return resp.json();
            }).then((data) => {
                let userid = localStorage.getItem('userid');
                console.log('Post ', data.post_title);
                this.formdata.post_title = data.post_title;
                this.formdata.description = data.description;
                // this.$router.push(`/profile/${userid}/${username}`);
            }).catch((err) => {
                console.log("Error: ", err)
            })
        }
    },
})

export default update_post;