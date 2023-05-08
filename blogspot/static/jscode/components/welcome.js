import sidebar from './sidebar.js'
import navigations from './navigations.js';

const welcome = Vue.component('welcome', {
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
					<router-link :to="{name: 'add_post', params:{userid: this.user_id}}"> <button class="btn btn-outline-info btn-sm button-10" style="margin-left: 25px; color: white;"> Create new post / blog </button>  </router-link>
				</div>
				<div class="col-md-9" style="padding: 50px;">
					<br><br>
					<p align="middle" style="font-size: 20pt;">There are no posts in your feed. <br> 
							Connect with other users to see what they are posting.
					</p>
				</div>
			</div>
		</div>
    </div>
    `,
    data() {
        return {
            user_id: 0,
            followers_count: 0,
            post_list: [],
            err_message: '',
            err_code: 0,
        }
    },
    methods: {
    },

    async mounted() {
        this.user_id = localStorage.getItem('userid')
        let id = this.user_id
        console.log('mounted hook from welcome - ', this.user_id);
        fetch(`/api/feeds/${id}` , {
            headers:{
                    'Content-Type': 'application/json',
                    // 'Authentication-Token':localStorage.getItem('auth-token'),
                },                
            }).then((resp) => {
                console.log("resp ", resp.status)
                if(resp.status >= 400 && resp.status < 600){
                    if(resp.status == 400){
                        this.err_message = "User Not following anyone";
                        this.err_code = 1;
                    }
                    else{
                        this.err_code = 2;
                        throw new Error("Something went wrong!!");
                    }                   
                }                        
                return resp.json();
            }).then((feed_data) => {
                // let posts = feed_data[0];
                console.log("posts in feed count: ");
                if(this.err_code == 0){
                    console.log("User following others")
                    this.$router.push('/feeds');
                }
            }).catch((err) => {
                this.err_message = err;
            }).finally( () =>{
                console.log(this.err_message);
            })
        }
})

export default welcome;