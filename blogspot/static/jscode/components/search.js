import sidebar from './sidebar.js'
import navigations from './navigations.js';

const search = Vue.component('search', {
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
					<br>
                    
					<form action="" id="user-search">
						<div class="row">
							<div class="col-md-3">
								<label style="font-size: 15pt;">Search for Users: </label>
							</div>
							<div class="col-md-6">
								<input type="text" name="search_user" v-model="input_user_name" placeholder="Username" width="60%">
								<button type="submit" @click.prevent="search" class="btn btn-success" name="search" style="margin-right: 25px; margin-left: 50px;">Search
									</button>
							</div>
						</div>				
					</form>
                    <br>
                    <p align="left"> *enter full or part of username to search for Users. &emsp; * to list all Users, leave the box empty and click on Search</p>
                    <div style="color: red;" v-if="err_code!=0" align="left"> *** {{err_message}} <br> </div>                    
                    <div v-else v-for="(user, index) in user_list">
                        <div style="padding: 20px;" align="middle">
                            <table width="75%" style="font-size: 15pt">
                                <tr v-if="user.user_name != curr_user_name">
                                    
                                    <td width="5%"> {{index+1}}) </td>
                                    <td width="55%">
                                    <router-link :to="{name: 'profile', params:{prof_userid: user.user_id, prof_username: user.user_name}}">
                                        {{ user.user_name }}  </router-link>  </td>
                                    <td> <button type="button" @click="follow(user.user_id)" class="btn btn-info" name="follow">Follow</button> </td>
                                    <td> <button type="button" @click="unfollow(user.user_id)" class="btn btn-danger" name="unfollow">Unfollow </button> </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`, 
    data() {
        return {
            count: 0,
            curr_user_name: '',
            input_user_name: '',
            srch_user: '',
            user_list: [],
            err_code: 0,
            err_message: '',
            follow_info: {
                curr_user: 0,
                follow_user: 0,
            }
        }
    },
    methods:{
        async search(){
            this.err_code = 0;
            this.err_message = '';
            this.curr_user_name = localStorage.getItem('username')
            console.log('Search user: ', this.srch_user)
            if(this.input_user_name > ''){
                this.srch_user = this.input_user_name;
                console.log('srch user: ', this.srch_user);
            }
            else{
                console.log('serach user is none');
                this.srch_user = '%';
                console.log('srch user: ', this.srch_user);
            }  
            fetch(`/api/search/${this.srch_user}` , {
                    headers:{
                            'Content-Type': 'application/json',
                            'Authentication-Token':localStorage.getItem('auth-token'),
                        },                
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
                    this.user_list = data;
                    console.log("users :", this.user_list)
                }
            }).catch((err) => {
                this.err_message = err;
                console.log('Error: ', this.err_message)
            }).finally( () =>{
                this.count = 0;
                console.log(this.err_message, this.err_code);
            })
        },
        async follow(user_id){
            this.follow_info.curr_user = localStorage.getItem('userid');
            this.follow_info.follow_user = user_id;
            console.log('follow: ', user_id, this.follow_info.curr_user, this.follow_info.follow_user)
            fetch(`/api/follow/${this.follow_info.curr_user}` , {
                headers:{
                        'Content-Type': 'application/json',
                        'Authentication-Token':localStorage.getItem('auth-token'),
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
                    console.log('return data:' , data)
                    if(data == 'successful'){
                        alert('Successfully followed!')
                    }                    
                    else{
                        alert('User already following!')
                    }
                }
            }).catch((err) => {
                this.err_message = err;
            })
        },
        async unfollow(user_id) {
            let confirmUnfollow = confirm("Do you want to Unfollow?")
            if(confirmUnfollow){
                this.follow_info.curr_user = localStorage.getItem('userid');
                this.follow_info.follow_user = user_id;
                console.log('follow: ', user_id, this.follow_info.curr_user, this.follow_info.follow_user)
                fetch(`/api/unfollow/${this.follow_info.curr_user}` , {
                    headers:{
                            'Content-Type': 'application/json',
                            'Authentication-Token':localStorage.getItem('auth-token'),
                        },                
                    method: 'delete',
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
                        console.log('return data:' , data)
                        if(data == 'successful'){ 
                            alert('Successfully Unfollowed!')
                        }
                        else{
                            alert('User Not following!')
                        }
                    }
                }).catch((err) => {
                    this.err_message = err;
                })
            }
        },
    },
    mounted(){
        this.user_id = localStorage.getItem('userid');
        if(!this.user_id){
            console.log('User not logged in')
            this.$router.push('/');
        }
    }
})


export default search;