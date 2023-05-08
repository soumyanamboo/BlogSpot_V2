import sidebar from './sidebar.js'
import navigations from './navigations.js';

const profile = Vue.component('profile', {
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
					<br> <br>
					<router-link to="/add_post"> <button class="btn btn-outline-info btn-sm button-10" style="margin-left: 25px; color: white;"> Create new post / blog </button>  </router-link>
                    <br>
                    <router-link :to="{name: 'update_user', params:{userid: this.$route.params.prof_userid}}"> <button class="btn btn-info" style="margin-left: 25px; color: white;"> Update Personal Details </button>  </router-link>
                    <br> <br>
                    <button class="btn btn-danger" @click="deleteUser" style="margin-left: 25px; color: white;"> Delete User Account </button>
                    <br> <br>
                    <button type="button" @click="export_post" class="btn btn-outline-info btn-sm button-10" style="margin-left: 25px; color: white;"> Export Posts </button> 
                    <br> 
                    <router-link :to="{name: 'import_posts'}"> <button class="btn btn-info" style="margin-left: 25px; color: white;"> Import Posts </button>  </router-link>
				</div>
                <div class="col-md-9" >
                    <h3 align="left" > Profile of {{ this.$route.params.prof_username }} : </h3>
                    <br><br>
                    <div class="content" >		
						<div class="c-left" align="left"> <h4>Total Posts : {{post_list.length}} </h4> 	</div>
						<div class="c-middle" align="center"> <h4>Followers : 
                            <router-link :to="{name: 'followers', params:{prof_userid: this.$route.params.prof_userid}}">
                                {{this.followers_cnt}}  </router-link>
                        </h4> 	</div>
						<div class="c-right" align="right"> <h4>Following : 
                            <router-link :to="{name: 'following', params:{prof_userid: this.$route.params.prof_userid}}">
                                {{this.following_cnt}}  </router-link>
                        </h4>	</div>						
					</div>
                    <div v-for="(item, index) in post_list">
                        <div class="post-item" align="center"> 
                            <h5 class="post-header" style="width: 20%; border: none; text-align: center;">
                                                {{ item.post_username }}   </h5>
                            <p> {{ item.post_title }} </p>
                            <p align="center"> <b>created/modified on: </b>{{ item.updated_time }}   </p>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="post_desc_grid">
                                        <img :src="image_path[index]" width="250" height="150" v-if="item.post_image>''"> 
                                        <div class="post_desc" style="padding: 10px;">
                                            <span v-html="item.description"></span>
                                        </div>
                                    </div>    
                                    <div class="post_desc_grid" style="width: 80%"> Comments:  
                                        <div><br>
                                            <div v-for="c in item.comments" align="left" v-if="item.post_id == c.post_id"> 
                                                <div style="display: inline; width:15%;"><b>{{ c.user }}: </b></div>
                                                <div style="display: inline; width:75%;"  > {{ c.comment }} </div>
                                                <div  v-if="c.user==user_name" style="display: inline; width:5%;" align="right">
                                                    <button style="font-size: 10px; align:middle" @click="deleteComment(c.comment_id)" class="btn btn-danger btn-sm"> Delete </button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <table width="80%">
                                            <tr>
                                                <td><input type="text" id="new_comment" v-model="comment.comment_text" size="30px"> </td>
                                                <td><button type="submit" class="btn btn-success" @click="addComment(item.post_id)"> Add Comment </button></td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div v-if="user_id == item.post_user">
                                <router-link :to="{name: 'update_post', params:{post_id: item.post_id}}">
                                    <button type="button" class="btn btn-info">Edit</button>
                                </router-link>
								&emsp;&emsp;
								<button type="button" class="btn btn-danger" @click=deletePost(item.post_id)> Delete</button>
                            </div>
                        </div>                        
                    </div>
                </div>                
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            user_id: 0,
            user_name: '',
            err_code: 0,
            err_message: '',
            post_list: [],
            user_info: '',
            followers_cnt: 0,
            following_cnt: 0,
            comment: {
                comment_text: '',
            },
            image_path: [],
        }
    },
    methods:{
        async addComment(post_id){
            let new_comment_text = document.getElementById('new_comment').value;
            this.comment.comment_text = new_comment_text;
            if(this.comment.comment_text > ''){
                console.log('comments: ', this.comment.comment_text, this.comment);
                fetch(`/api/comments/${this.user_id}/${post_id}` , {
                    headers:{
                        'Content-Type': 'application/json',
                        'Authentication-Token':localStorage.getItem('auth-token'),
                    },
                    method: 'post', 
                    body: JSON.stringify(this.comment),         
                }).then((resp) => {
                    console.log('Status: ', resp.status, resp)                
                    if(resp.status >= 400 && resp.status <= 600){
                        if(resp.status == 400){
                            throw new Error("Wrong post id!!");
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
                    console.log("comments added");
                    this.comment.comment_text = '';
                    this.get_profile_details();
                }).catch((err) =>{

                })
            }
        },
        async deletePost(post_id){
            let confirmDel = confirm("Do you want to delete the Post?")
            console.log('post id: ', post_id, confirmDel)
            if(confirmDel){
                fetch(`/api/post/${post_id}` , {
                    headers:{
                        'Content-Type': 'application/json',
                        'Authentication-Token':localStorage.getItem('auth-token'),
                    },
                    method: 'delete',
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
                    console.log('Post deleted', data);
                    alert("Post Deleted Successfully!!!")                    
                    this.get_profile_details();
                }).catch((err) => {
                    console.log("Error: ", err)
                })
            }
        },
        async get_follow_cnt() {
            console.log('getting follow count of: ', this.$route.params.prof_userid)
            fetch(`/api/user/${this.$route.params.prof_userid}` , {
                    headers:{
                            'Content-Type': 'application/json',
                            'Authentication-Token':localStorage.getItem('auth-token'),
                        },                
            }).then((resp) => {
                        console.log("resp ", resp.status)
                        if(resp.status >= 400 && resp.status < 600){
                            if(resp.status == 400){
                                this.err_message = "User not found";
                                this.err_code = 1;
                            }
                            else if(resp.status == 401){
                                localStorage.clear();
                                this.$router.push('/');
                            }
                            else{
                                this.err_code = 2;
                                throw new Error("Something went wrong!!");
                            }                   
                        }                        
                        return resp.json();
            }).then((data) => {
                        console.log("error-code: ", this.err_code);
                        if(this.err_code == 0){
                            this.user_info = data;
                            console.log("followers count :", this.user_info.followers_count)
                            console.log("following count :", this.user_info.following_count)
                            this.followers_cnt = this.user_info.followers_count;
                            this.following_cnt = this.user_info.following_count;
                        }
            }).catch((err) => {
                        this.err_message = err;
            })
            
        },
        async get_profile_details(){
            console.log("profile userid: ", this.$route.params.prof_userid, this.$route.params.prof_username)
            this.user_id = localStorage.getItem('userid');
            this.user_name = localStorage.getItem('username');
            console.log('Current user: ', this.user_id, this.user_name)
            console.log("profile of: ", `${this.$route.params.prof_username}, ${this.$route.params.prof_userid}`)
            fetch(`/api/profile/${this.$route.params.prof_userid}/${this.$route.params.prof_username}` , {
                    headers:{
                            'Content-Type': 'application/json',
                            'Authentication-Token':localStorage.getItem('auth-token'),
                        },                
            }).then((resp) => {
                        console.log("resp ", resp.status)
                        if(resp.status >= 400 && resp.status < 600){
                            if(resp.status == 400){
                                this.err_message = "User Not created any post";
                                this.err_code = 1;
                            }
                            else if(resp.status == 401){
                                localStorage.clear();
                                this.$router.push('/');
                            }
                            else{
                                this.err_code = 2;
                                throw new Error("Something went wrong!!");
                            }                   
                        }                        
                        return resp.json();
            }).then((data) => {
                let image_src = ''
                console.log("error-code: ", this.err_code);
                if(this.err_code == 0){
                    this.post_list = data;
                    console.log("posts :", this.post_list, this.post_list.length)
                    for (let i=0; i<this.post_list.length; i++) {
                        image_src = '../../static/' + this.post_list[i].post_image
                        this.image_path.push(image_src)
                    }
                    console.log('images: ', this.image_path)
                }
            }).catch((err) => {
                        this.err_message = err;
            }).finally( () =>{
                        console.log(this.err_message, this.err_code);
            })
        },
        async deleteUser(){
            let confirmDelUser = confirm("Do you want to delete the User Account?")
            console.log('user id: ', this.user_id, confirmDelUser)
            if(confirmDelUser){
                fetch(`/api/user/${this.user_id}` , {
                    headers:{
                        'Content-Type': 'application/json',
                        'Authentication-Token':localStorage.getItem('auth-token'),
                    },
                    method: 'delete',
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
                    console.log('User Account deleted', data);
                    alert("User Account Deleted Successfully!!!");
                    fetch('/logout').then((res)=> {
                        if(res.status>=200 && res.status<=300){
                            localStorage.clear()
                            this.$router.push('/')
                        }
                    }).catch((err) => {
                        console.log("cannot logout", err)
                    })
                }).catch((err) => {
                    console.log("Error: ", err)
                })
            }
        },
        async deleteComment(comment_id){
            fetch(`/api/delcomment/${comment_id}` , {
                headers:{
                        'Content-Type': 'application/json',
                        'Authentication-Token':localStorage.getItem('auth-token'),
                    },
                    method: 'delete', 
                    body: JSON.stringify(this.comment),         
            }).then((resp) => {
                console.log('Status: ', resp.status, resp)                
                    if(resp.status >= 400 && resp.status <= 600){
                        if(resp.status == 400){
                            throw new Error("Wrong post id!!");
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
                console.log("comments deleted succesfully");
                this.comment.comment_text = '';
                this.get_profile_details();
            }).catch((err) =>{

            })                    
        },
        async export_post(){
            console.log('Export posts...')
            fetch(`/api/export` , {
                headers:{
                    'Content-Type': 'application/json',
                    'Authentication-Token':localStorage.getItem('auth-token'),
                },
            }).then((resp) => {
                console.log('Status: ', resp.status)
                if(resp.status >= 400 && resp.status <= 600){
                    if(resp.status == 401){
                        localStorage.clear();
                        this.$router.push('/');
                    }
                    else{
                        throw new Error("Something went wrong!!");  
                    }                                         
                }                  
                return resp.blob();
            }).then((blob) => {
                console.log('All Posts created by ', localStorage.getItem('username'), 'Exported');
                let msg = 'All Posts created by ' + localStorage.getItem('username') + ' Exported'
                alert(msg)
                var file = window.URL.createObjectURL(blob);
                window.location.assign(file);
                // this.$router.go();
            }).catch((err) => {
                console.log("Error: ", err)
            })
        },
    },
    mounted() {
        this.user_id = localStorage.getItem('userid');
        if(!this.user_id){
            console.log('User not logged in')
            this.$router.push('/');
        }
        else{
            this.get_profile_details();
            this.get_follow_cnt();
        }
    },
    
    watch: {
        '$route' (to, from) {
            console.log('route changed', to.path, from.path);
            let route_starts_with = to.path.substring(0,8)
            console.log(route_starts_with)
            if(route_starts_with == '/profile'){
                this.get_profile_details();
                this.get_follow_cnt()
            }
            
        }
    },
})


export default profile;