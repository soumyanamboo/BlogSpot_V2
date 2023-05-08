const post_display = Vue.component('post_display', {
    props: ['post_item'],
    template: `
    <div>
        <div class="post-item" align="center"> 
            <h5 class="post-header" style="width: 20%; border: none; text-align: center;">       
                
            <router-link :to="{name: 'profile', params:{prof_userid: post_item.post_user, prof_username: post_item.post_username}}">
                {{ post_item.post_username }}  </router-link> </h5>
            <p> <u> {{ post_item.post_title }} </u> </p>
            <p align="right"> <b>created/modified on: </b>{{ post_item.updated_time }}   </p>
            <div class="row">            
                <div class="col-md-10">
                    <div class="post_desc_grid"> 
                        <img :src="img_path" width="250" height="150" v-if="image_exists"> 
                        <div class="post_desc" style="padding: 10px;">
                            <span v-html="post_item.description"></span>
                        </div>
                    </div>    
                    <div class="post_desc_grid" style="width: 90%"> Comments:<br>
                        <div><br>
                            <div v-for="c in post_item.comments" align="left"> 
                                <div style="display: inline; width:15%"><b>{{ c.user }}: </b></div>
                                <div style="display: inline; width:75%"> {{ c.comment }} </div>
                                <div  v-if="c.user==user_name" style="display: inline; width:5%">
                                    <button style="font-size: 10px;" @click="deleteComment(c.comment_id)" class="btn btn-danger btn-sm"> Delete </button>
                                </div>
                            </div>
                        </div>
                        <table width="80%">
                            <tr>
                                <td><input type="text" id="new_comment" v-model="comment.comment_text" size="30px"> </td>
                                <td><button type="submit" class="btn btn-success" @click="addComment(post_item.post_id)"> Add Comment </button></td>
                            </tr>
                        </table>
                    </div>
                </div>
                <div class="col-md-2">
                    <div style="width:50%"> 
                        <button id="likeBtn" style="font-size: 12px;" @click="like(post_item)" class="btn btn-primary"> <img src="../../static/thumbsup.svg"> </button>
                        <label v-if="post_item.likes>0" style="width: 30px"> {{ post_item.likes }} </label>
                        <label v-else></label>
                    </div>
                    <div style="width:50%"> 
                        <button id="dislikeBtn" style="font-size: 12px;" @click="dislike(post_item)" class="btn btn-danger"> <img src="../../static/thumbsdown.svg"> </button>
                        <label v-if="post_item.dislikes>0" style="width: 20px"> {{ post_item.dislikes }} </label>
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
            image_exists: false,
            img_path:'',
            err_message: '',
            err_code: 0,
            feed_data: [],
            like_status: true,
            dislike_status: true,
            comment: {
                comment_text: '',
            },
            post_info: {
                post_title: '',
                post_likes: 0,
                post_dislikes: 0,
                post_user: '',
            },
        }
    },
    methods: {
        async addComment(post_id){
            console.log('current comment :', this.comment.comment_text)
            console.log('comments user: ', this.user_id);
            if(this.comment.comment_text > ''){
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
                    console.log("comments added", data);
                    this.comment.comment_text = '';
                    this.$router.go(0);
                }).catch((err) =>{
    
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
                // alert("comments deleted succesfully")
                this.$router.go();
                // this.$router.push(`/feeds/${user_id}`);
            }).catch((err) =>{

            })
        },
        async like(curr_item){
            let post_id = curr_item.post_id;
            console.log('Like post id: ', post_id)
            let like_count = curr_item.likes
            console.log(this.like_status)
            curr_item.likes += 1
            this.post_info.post_likes = curr_item.likes;
            console.log(curr_item.likes)
            this.post_info.post_title = curr_item.post_title;                
            this.post_info.post_user = curr_item.post_user;
            console.log(this.post_info)
            fetch(`/api/post/${post_id}` , {
                headers:{
                    'Content-Type': 'application/json',
                    'Authentication-Token':localStorage.getItem('auth-token'),
                },
                method: 'put',
                body: JSON.stringify(this.post_info),
            }).then((resp) => {
                console.log('Status: ', resp.status)
                if(resp.status >= 400 && resp.status <= 600){
                    if(resp.status == 409){
                        throw new Error("Post title already exists!!");
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
                console.log('Like incremented: ', data.likes)
                this.like_status = !this.like_status;                
            }).catch((err) => {
                console.log("Error: ", err)
            })
        },
        async dislike(curr_item){
            let post_id = curr_item.post_id;
            console.log('disLike post id: ', post_id)
            console.log(this.dislike_status)
            curr_item.dislikes += 1
            this.post_info.post_dislikes = curr_item.dislikes ;

            this.post_info.post_title = curr_item.post_title;            
            this.post_info.post_user = curr_item.post_user;
            console.log(this.post_info)
            fetch(`/api/post/${post_id}` , {
                headers:{
                    'Content-Type': 'application/json',
                    'Authentication-Token':localStorage.getItem('auth-token'),
                },
                method: 'put',
                body: JSON.stringify(this.post_info),
            }).then((resp) => {
                console.log('Status: ', resp.status)
                if(resp.status >= 400 && resp.status <= 600){
                    if(resp.status == 409){
                        throw new Error("Post title already exists!!");
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
                console.log('disLike incremented: ', data.dislikes)
                this.dislike_status = !this.dislike_status;
            }).catch((err) => {
                console.log("Error: ", err)
            })
        },
    },
    mounted(){
        this.user_id = localStorage.getItem('userid');
        this.user_name = localStorage.getItem('username');
        this.image_exists = false;
        let image_name = this.post_item.post_image
        console.log('image: ', this.image_exists, image_name)
        if(image_name > '' ){
            this.image_exists = true;
            this.img_path = '../../../static/' + image_name;
            console.log('post image in profile: ', this.img_path);
            return this.img_path;
        }
    }
    
})


export default {
    name: post_display,
    props: ['post_item'],
}