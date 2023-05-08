const update_user = Vue.component('update_user', {
    template: `
        <div>
            <div class="container">
            <div class="header">  
                <div class="h-left"> <img src="../static/header1.jpg" width="300" height="150"></div>
                <div class="h-middle" ><h1>BlogSpot</h1>
                    <p>Freedom of Expression...</p> </div>  
                    <div class="h-right"> <navigations></navigations> </div>
            </div>
                <div class="middle">
                    <br><h4>Update Personal Details :</h4> 
                    <br><div style="color: red;" v-if="!valid"> {{message}} </div> <br>
                    <form  action="" id="register-form">
                        <div class="row">
                            <div class="col-md-3"> </div>
                            <div class="col-md-2"> <label>User Name: </label> </div>
                            <div class="col-md-2"> <input type="text" name="username" v-model="formdata.username" disabled> </div>
                        </div><br>
                        <div class="row">
                            <div class="col-md-3"> </div>
                            <div class="col-md-2"> <label>Email id: </label> </div>
                            <div class="col-md-2"> <input type="text" name="email" v-model="formdata.email" required> </div>
                            <div class="col-md-3" style="color: red;" v-if="!valid_email"> {{ email_message }} </div>
                        </div><br>
                        <div class="row">
                            <div class="col-md-3"> </div>
                            <div class="col-md-2"> <label>Password: </label> </div>
                            <div class="col-md-2"> <input type="password" name="password" v-model="formdata.password" required> </div>
                            <div class="col-md-3" style="color: red;" v-if="!valid_pass"> {{ password_message }} </div>
                        </div> <br>
                        <div class="row">
                            <div class="col-md-3"> </div>
                            <div class="col-md-2"> <label>Display Image: </label> </div>
                            <div class="col-md-3"> <input type="file" id="imgupload" name="img_name" accept="image/*"> </div>
                        </div><br>
                        <div class="row">
                            <div class="col-md-3"> </div>
                            <div class="col-md-2"> <label>Report Format: </label> </div>
                            <div class="col-md-3"> 
                                <div class="control">
                                    <label class="radio"> <input type="radio" name="report_format" id="html" value="html"> HTML </label>
                                    <label> &nbsp;</label>
                                    <label class="radio"> <input type="radio" name="report_format" id="pdf" value="pdf"> PDF </label>
                                </div>
                            </div>
                        </div><br>
                        <div class="row">  
                            <div class="col-md-4"> </div>
                            <div class="col-md-1">
                                <button type="submit" @click.prevent="updateUser" class="btn btn-success" name="update" style="margin-right: 25px; margin-left: 50px;"> Submit </button>
                            </div>
                            <div class="col-md-1">
                                <button @click="cancel" class="btn btn-primary" style="margin-left: 25px; color: white;"> Cancel </button>
                            </div>                            
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            formdata: {
                user_id: '',
                username: '',
                email: '',
                password: '',
                image_path: '',
                report_format: '',
            },
            valid: true,
            valid_email: true,
            valid_pass: true,
            message: '',
            password_message: '',
            email_message: '',
        }
    },
    methods: {
        async updateUser(){            
            console.log(this.valid_pass , this.valid_email)
            if(this.valid_pass && this.valid_email){
                let image_name = document.getElementById('imgupload');
                console.log('image file: ', image_name);
                console.log('Image src: ', image_name.value)
                // this.formdata.image_path = image_name.files.item(0).name;
                if (image_name.value > '') {
                    this.formdata.image_path = image_name.files.item(0).name;
                    console.log('image_path: ', this.formdata.image_path) 
                }
                console.log(this.formdata.username, this.formdata.password, this.formdata.image_path)
                console.log(this.formdata)
                fetch(`/api/user/${this.formdata.user_id}` , {
                    headers:{
                        'Content-Type': 'application/json',
                        'Authentication-Token':localStorage.getItem('auth-token'),
                    },
                    method: 'put',
                    body: JSON.stringify(this.formdata),
                }).then((response_user) => {
                    console.log('Status: ', response_user.status, response_user)
                    
                    if(response_user.status >= 400 && response_user.status <= 600){
                        if(response_user.status == 409){
                            throw new Error("Username or Email already exists!!");
                        }
                        else if(resp.status == 401){
                            localStorage.clear();
                            this.$router.push('/');
                        }
                        else{
                            throw new Error("Something went wrong!!");
                        }                        
                    }                    
                    return response_user.json();
                }).then((userdata) => {
                    console.log('User data: ', userdata.user_id, userdata.user_name, userdata.email, userdata.image)
                    localStorage.setItem('userid', userdata.user_id );
                    localStorage.setItem('username', userdata.user_name );
                    localStorage.setItem('email', userdata.email );
                    localStorage.setItem('userimage', userdata.image );
                    localStorage.setItem('report_format', userdata.report_format );
                    alert('Succesfully updated...')
                    this.$router.push(`/profile/${userdata.user_id}/${userdata.user_name}`);
                }).catch((err) => {
                    this.valid=false;
                    this.message = err;
                })               
            }
            else{
                this.message = "Please provide valid input!"
            } 
        },
        cancel() {
            let userid = localStorage.getItem('userid')
            let username = localStorage.getItem('username')
            this.$router.push(`/profile/${userid}/${username}`);
        },
    },
    watch: {
        'formdata.email' (newVal) {
            let count = 0;
            this.valid_email = true;
            this.email_message  = '';
            console.log('index: ', newVal.indexOf('@'), newVal.indexOf('.'))
            console.log('Updated: ', newVal)
            if( newVal.indexOf('@') < 0 || newVal.indexOf('.') < 0 ){
                this.valid_email = false;
                this.email_message  = 'Please enter a valid email';                
            }
            console.log("email: ", this.email_message)
        },
    },
    async mounted() {
        this.user_id = localStorage.getItem('userid');
        if(!this.user_id){
            console.log('User not logged in')
            this.$router.push('/');
        }
        else{
            console.log("Update user id: ", this.$route.params.userid)
            fetch(`/api/user/${this.$route.params.userid}` , {
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
                return resp.json();
            }).then((data) => {
                console.log('User ', data.user_name);
                this.formdata.email = data.email;
                this.formdata.username = data.user_name;
                this.formdata.user_id = data.user_id;
                var report_type = data.report_format
                console.log('Report: ', report_type)
                if(report_type == 'html'){
                    console.log('checked box: ', document.getElementById('html').checked)
                    console.log('HTML format')
                    document.getElementById('html').checked = true
                }
                else{
                    console.log('PDF format')
                    document.getElementById('pdf').checked = true
                }
                // this.$router.push(`/profile/${userid}/${username}`);
            }).catch((err) => {
                console.log("Error: ", err)
            })
        }
    },
})

export default update_user;