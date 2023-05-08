const login = Vue.component('login', {
    template: `
        <div>
            <div class="container">  
                <div class="header">  
                    <div class="h-left"> <img src="../static/header1.jpg" width="300" height="150"></div>
                    <div class="h-middle"><h1>BlogSpot</h1>
                        <p>Freedom of Expression...</p> </div>  
                </div>          
                <div class="middle">
                    <br><h4>Please login :</h4> 
                    <br><div style="color: red;" v-if="!success"> {{message}} </div> <br>
                    <form  action="" id="login-form">
                        <div class="row">
                            <div class="col-md-3"> </div>
                            <div class="col-md-1"> <label>User Email: </label> </div>
                            <div class="col-md-6"> <input type="text" name="email" placeholder="email" v-model="formdata.email" > </div>
                        </div><br>
                        <div class="row">
                            <div class="col-md-3"> </div>
                            <div class="col-md-1"> <label>Password: </label> </div>
                            <div class="col-md-6"> <input type="password" name="password" placeholder="password" v-model="formdata.password" > </div>
                        </div> <br>
                        <div class="row">  
                            <div class="col-md-3"> </div>
                            <div class="col-md-1">
                                <button type="submit" @click.prevent="loginUser" class="btn btn-success" name="login" style="margin-right: 25px; margin-left: 50px;"> Login </button>
                            </div>
                            <div class="col-md-1">                            
                            <router-link to="/register_user"> <button class="btn btn-primary" style="margin-left: 25px; color: white;"> Register </button>  </router-link>
                            </div>                            
                        </div>
                        <div class="row">  
                            <div class="col-md-3"> </div>
                            <div class="col-md-6"> <br><p>*New users please Register</p> </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `,

    data() {
        return {
            formdata: {
                email: '',
                password: '',
            },
            success: true,
            message: '',
        }
    },
    methods: {
        async loginUser() {
            this.success = false;
            this.message = '';
            //--------------------------------------------
            const res = await fetch('/logout')
            if(res.ok){
                localStorage.clear()
            }
            //--------------------------------------------

            console.log('login verification', this.formdata)
            fetch('/login?include_auth_token',{
                method:'post',
                headers:{
                    'Content-Type':'application/json',
                },
                body:JSON.stringify(this.formdata),
            }).then((resp) => {
                console.log('Auth resp status: ', resp.status)
                if(resp.status >= 400 && resp.status <= 600){
                    this.message = 'Wrong Email or Password!!!'
                    throw new Error("Authentication error");                      
                }
                return resp.json();
            }).then((data) => {
                console.log("Auth token returned", data)
                console.log('token: ', data.response.user.authentication_token)
                let auth_token = data.response.user.authentication_token
                localStorage.setItem('auth-token',auth_token)
                fetch(`/api/user_login` , {
                    headers:{
                        'Content-Type': 'application/json',
                        'Authentication-Token':auth_token,
                    },
                }).then((response_user) => {
                    console.log('status: ', response_user.status)
                    if(response_user.status > 400 && response_user.status < 600){
                        if(response_user.status == 404){
                            this.success=false
                            throw new Error("Wrong Username or Password!!");                            
                        }
                        else{
                            throw new Error("Something went wrong!!");
                        }                    
                    }
                    return response_user.json();
                }).then((userdata) => {
                    localStorage.setItem('userid', userdata.user_id );
                    localStorage.setItem('username', userdata.user_name );
                    localStorage.setItem('email', userdata.email );
                    localStorage.setItem('image', userdata.image ); 
                    console.log("response data:", userdata.user_name);
                    console.log('localStorage:', localStorage.getItem('auth-token'));
                    this.$router.push(`/feeds/${userdata.user_id}`);
                }).catch((err) => {
                    this.message = err;
                    console.log("Error message: ", this.message);
                    localStorage.clear();
                })
            })
        },
    },
    mounted(){
        let login = localStorage.getItem('auth-token');
        let userid = localStorage.getItem('userid');
        if(login){
            this.$router.push(`/feeds/${userid}`);
        }
    }
})

export default login;