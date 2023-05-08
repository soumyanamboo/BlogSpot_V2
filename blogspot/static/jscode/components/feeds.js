import sidebar from './sidebar.js'
import navigations from './navigations.js';
import post_display from './post_display.js';

const feeds = Vue.component('feeds', {
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
				</div>
                <div class="col-md-9" >
                    <div v-if="err_code == 0">
                        <h4 align="left"> Feeds from your friends: </h4> <br>
                        <div v-if="feed_data.length == 0">
                            <h5 align="left"> No posts from your friends... </h5>
                        </div>
                        <div v-else v-for="(item, index) in feed_data">
                            <post_display :post_item="feed_data[index]"></post_display>
                        </div>
                    </div>
                    <div v-else>
                        <p align="middle" style="font-size: 20pt;">There are no posts in your feed. <br> 
                        Connect with other users to see what they are posting.</p>
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
            success: false,
            err_message: '',
            err_code: 0,
            feed_data: [],
            like_status: true,
            dislike_status: false,
            comment: {
                comment_text: '',
            }
        }
    }, 
    methods: {

    },
    async mounted(){
        this.user_id = localStorage.getItem('userid');
        this.user_name = localStorage.getItem('username');
        if(!this.user_id){
            console.log('User not logged in')
            this.$router.push('/');
        }
        else{
            console.log(this.user_id)
        
            fetch(`/api/feeds/${this.user_id}` , {
                    headers:{
                            'Content-Type': 'application/json',
                            'Authentication-Token':localStorage.getItem('auth-token'),
                        },                
            }).then((resp) => {
                        console.log("resp feeds mounted", resp.status)
                        if(resp.status >= 400 && resp.status < 600){
                            if(resp.status == 400){
                                this.err_message = "User Not following anyone";
                                this.err_code = 1;
                            }
                            else if(resp.status == 401){
                                console.log('User not authorized...');
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
                        // let posts = feed_data[0];
                        console.log("error-code: ", this.err_code);
                        if(this.err_code == 0){
                            this.feed_data = data;
                            console.log("Feeds :", data)
                        }
            }).catch((err) => {
                        this.err_message = err;
            }).finally( () =>{
                        console.log(this.err_message, this.err_code);
            })
        }
    },
})


export default feeds;