import sidebar from './sidebar.js'
import navigations from './navigations.js';

const followers = Vue.component('followers', {
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
                </div>
                <div class="col-md-9" style="padding: 50px;">	
                    <h4 align="left">Followers of <b>{{ prof_user_name }}: </b></h4>
                    <br>
                    <div style="padding: 20px;" align="middle" v-if="followers_list.length >0 ">
                        <div v-for="(user, index) in followers_list">
                            <table width="75%" style="font-size: 15pt">
                                <tr>
                                    <td width="5%"> {{index+1}}) </td>
                                    <td width="55%">
                                    <router-link :to="{name: 'profile', params:{prof_userid: user.user_id, prof_username: user.user_name}}">
                                        {{ user.user_name }}  </router-link>  </td>
                                    <td>
                                        <div v-if="prof_user_name==curr_user_name">
                                            <span> <button type="button" @click="follow(user.user_id)" class="btn btn-info" name="follow">Follow</button> </span>  &nbsp
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    <div v-else>
                        <br>
                        <h5 align="left"> No Followers for {{prof_user_name}} !!! </h5>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            curr_user_name: '',
            prof_user_name: '',
            user_id: 0,
            followers_list: '',
            err_code: 0,
            err_message: '',
            follow_info: {
                curr_user: 0,
                follow_user: 0,
            },
        }
    },
    methods: {
        async getFollowers(){
            this.curr_user_name = localStorage.getItem('username')
            this.user_id = this.$route.params.prof_userid
            console.log('Inside followers: userid=', this.user_id)
            fetch(`/api/user/${this.user_id}` , {
                    headers:{
                            'Content-Type': 'application/json',
                            'Authentication-Token':localStorage.getItem('auth-token'),
                        },                
            }).then((resp) => {
                        console.log("resp status", resp.status)
                        if(resp.status >= 400 && resp.status < 600){
                            if(resp.status == 400){
                                this.err_code = 1;
                                this.err_message = "User Not found";
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
                        if(this.err_code == 0){
                            this.followers_list = data.followers_list;
                            console.log("users :", this.followers_list);
                            this.prof_user_name = data.user_name
                        }
            }).catch((err) => {
                        this.err_message = err;
            }).finally( () =>{
                        console.log(this.err_message, this.err_code);
            })
        },
        async follow(user_id){
            this.follow_info.curr_user = localStorage.getItem('userid');
            this.follow_info.follow_user = user_id;
            console.log('follow: ', user_id, this.follow_info.curr_user, this.follow_info.follow_user)
            fetch(`/api/follow/${this.follow_info.curr_user}` , {
                headers:{
                'Authentication-Token':localStorage.getItem('auth-token'),
                    'Content-Type': 'application/json',
                },                
                method: 'post',
                body: JSON.stringify(this.follow_info),
            }).then((resp) => {
                console.log("resp ", resp.status)
                if(resp.status >= 400 && resp.status < 600){
                    if(resp.status == 400){
                        this.err_message = "User Not found";
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
                    console.log("users :", this.user_list);
                    alert('Successfully followed!')
                }
            }).catch((err) => {
                this.err_message = err;
            })
        },
    },
    async mounted() {
        this.user_id = localStorage.getItem('userid');
        if(!this.user_id){
            console.log('User not logged in')
            this.$router.push('/');
        }
        else{
            this.getFollowers();
        }
    }
})


export default followers;