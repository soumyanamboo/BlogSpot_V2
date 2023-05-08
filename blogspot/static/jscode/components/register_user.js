const register_user = Vue.component('register_user', {
    template: `
        <div>
            <div class="container">
            <div class="header">  
                <div class="h-left"> <img src="../static/header1.jpg" width="300" height="150"></div>
                <div class="h-middle" ><h1>BlogSpot</h1>
                    <p>Freedom of Expression...</p> </div>  
            </div>
                <div class="middle">
                    <br><h4>New User Registration :</h4> 
                    <br><div style="color: red;" v-if="!valid"> {{message}} </div> <br>
                    <form  action="" id="register-form">
                        <div class="row">
                            <div class="col-md-3"> </div>
                            <div class="col-md-2"> <label>User Name: </label> </div>
                            <div class="col-md-2"> <input type="text" name="username" placeholder="Username" v-model="formdata.username" required> </div>
                        </div><br>
                        <div class="row">
                            <div class="col-md-3"> </div>
                            <div class="col-md-2"> <label>Email id: </label> </div>
                            <div class="col-md-2"> <input type="text" name="email" placeholder="mail-id" v-model="formdata.email" required> </div>
                            <div class="col-md-3" style="color: red;" v-if="!valid_email"> {{ email_message }} </div>
                        </div><br>
                        <div class="row">
                            <div class="col-md-3"> </div>
                            <div class="col-md-2"> <label>Password: </label> </div>
                            <div class="col-md-2"> <input type="password" name="password" placeholder="password" v-model="formdata.password" required> </div>
                            <div class="col-md-3" style="color: red;" v-if="!valid_pass"> {{ password_message }} </div>
                        </div> <br>
                        <div class="row">
                            <div class="col-md-3"> </div>
                            <div class="col-md-2"> <label>Retype Password: </label> </div>
                            <div class="col-md-2"> <input type="password" name="repassword" placeholder="repeat password" v-model="repassword" required> </div>
                            <div class="col-md-3" style="color: red;" v-if="!valid_repass"> {{ repassword_message }} </div>
                        </div><br>
                        <div class="row">
                            <div class="col-md-3"> </div>
                            <div class="col-md-2"> <label>Display Image: </label> </div>
                            <div class="col-md-3"> <input type="file" id="imgupload" name="img_name" accept="image/*"> </div>
                        </div><br>
                        <div class="row">
                            <div class="col-md-3"> </div>
                            <div class="col-md-2"> <label>Monthly Report Format: </label> </div>
                            <div class="col-md-3"> 
                                <div class="control">
                                    <label class="radio"> <input type="radio" name="report_format" value="html" checked> HTML </label>
                                    <label> &nbsp;</label>
                                    <label class="radio"> <input type="radio" name="report_format" value="pdf"> PDF </label>
                                </div>
                                <p>* Format for Monthly User activity Report </p>
                            </div> 
                        </div><br>
                        <div class="row">  
                            <div class="col-md-4"> </div>
                            <div class="col-md-1">
                                <button type="submit" @click.prevent="registerUser" class="btn btn-success" name="register" style="margin-right: 25px; margin-left: 50px;"> Submit </button>
                            </div>
                            <div class="col-md-1">
                                <button @click="reset" class="btn btn-primary" style="margin-left: 25px; color: white;"> Reset </button>
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
                username: '',
                email: '',
                password: '',
                profile_image: '',
                report_format: '',
            },
            valid: false,
            valid_repass: false,
            valid_email: false,
            valid_pass: false,
            message: '',
            password_message: '',
            repassword: '',
            repassword_message: '',
            email_message: '',
        }
    },
    methods: {
        async registerUser(){            
            if(this.valid_pass && this.valid_repass && this.valid_email && this.formdata.username.trim() > ''){
                let image_name = document.getElementById('imgupload');
                console.log('image file: ', image_name);
                console.log('Image src: ', image_name.value)
                var report = document.getElementsByName('report_format');
                this.formdata.report_format = 'HTML'
                console.log('Report format: ', this.formdata.report_format)
                for(var i=0; i<report.length; i++){
                    if(report[i].checked){
                        console.log('checked: ', report[i].value)
                        this.formdata.report_format = report[i].value
                        console.log('Format: ', this.formdata.report_format)
                    }
                }
                console.log('Report format last: ', this.formdata.report_format)
                // this.formdata.profile_image = image_name.files.item(0).name;
                if (image_name.value > '') {
                    this.formdata.profile_image = image_name.files.item(0).name;
                    console.log('profile_image: ', this.formdata.profile_image) 
                }
                console.log(this.formdata.username, this.formdata.password, this.formdata.profile_image)
                console.log(this.formdata)
                fetch('/api/user' , {
                    headers:{
                        'Content-Type': 'application/json',
                        'Authentication-Token':localStorage.getItem('auth-token'),
                    },
                    method: 'post',
                    body: JSON.stringify(this.formdata),
                }).then((response_user) => {
                    console.log('Status: ', response_user.status, response_user)
                
                    if(response_user.status >= 400 && response_user.status <= 600){
                        if(response_user.status == 409){
                            throw new Error("Username or Email already exists!!");
                        }
                        else{
                            throw new Error("Something went wrong!!");
                        }                        
                    }                    
                    return response_user.json();
                }).then((userdata) => {
                    console.log('User data: ', userdata.id, userdata.username, userdata.email, userdata.profile_image)
                    localStorage.setItem('userid', userdata.id );
                    localStorage.setItem('username', userdata.username );
                    localStorage.setItem('email', userdata.email );
                    localStorage.setItem('userimage', userdata.profile_image );
                    alert('Succesfully registered... Please login to continue...')
                    this.$router.push(`/`);
                }).catch((err) => {
                    this.valid=false;
                    this.message = err;
                })               
            }
            else{
                this.message = "Please provide valid input!"
            } 
        },
        genHexString(len) {
            let output = '';
            for (let i = 0; i < len; ++i) {
                output += (Math.floor(Math.random() * 16)).toString(16);
            }
            return output;
        },
        reset() {
            this.formdata.username = '';
            this.formdata.email = '';
            this.formdata.password = '';
            this.formdata.profile_image = '';
            this.valid = false;
            this.valid_pass = false;
            this.valid_repass = false;
            this.valid_email = false;
            this.message = '';
            this.repassword = '',
            this.repassword_message = '';
            this.email_message = '';
        },
    },
    computed: {
    },
    watch: {
        'formdata.password' (newVal) {
            this.valid_pass = false;
            this.password_message  = '';
            if(newVal.length >= 8 )  this.valid_pass = true ;
           
            if(!this.valid){
                this.password_message  = 'Password should be minimum 8 characters';
            }
            console.log(this.valid_pass, this.password_message)
        },
        'repassword' (newVal) {
            this.valid_repass = true;
            this.repassword_message  = '';
            // if(this.repassword != this.formdata.password){
            if(newVal != this.formdata.password){
                this.valid_repass = false;
                this.repassword_message = "Passwords does not match!!";
            }
            console.log(this.repassword, this.repassword_message)
        },
        'formdata.email' (newVal) {
            let count = 0;
            this.valid_email = true;
            this.email_message  = '';
            console.log('index: ', newVal.indexOf('@'))
            if( newVal.indexOf('@') < 0 || newVal.indexOf('.') < 0 ){
                this.valid_email = false;
                this.email_message  = 'Please enter a valid email';
                
            }
        },
    },
})

export default register_user;