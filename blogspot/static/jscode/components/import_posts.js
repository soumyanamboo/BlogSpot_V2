import sidebar from './sidebar.js'
import navigations from './navigations.js';

const import_posts = Vue.component('import_posts', {
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
                    <h5 align="left"><b> Import Posts from file : </b></h5> <br> 
					<form  action="" id="import_posts" enctype = "multipart/form-data"> 
                        <div class="row">
                            <div class="col-md-2"> <label>Import from File: </label> </div>
                            <div class="col-md-10" align="left"> <input type="file" id="import" name="import"> </div>
                        </div><br>
                        <div class="row">  
                            <div class="col-md-1"> </div>
                            <div class="col-md-2">
                                <button type="submit" @click.prevent="importPosts" class="btn btn-success" name="importbtn"> Import Posts </button>
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
            userid: 0,
            formdata: {
                import_file: '',
            },
            err_message: '',
            err_code: 0,
        }
    },
    methods: {
        async importPosts(){
            console.log('Import posts from files');
            this.userid = localStorage.getItem('userid');
            let filename = document.getElementById('import');
            if (filename.value > '') {
                this.formdata.import_file = filename.files.item(0).name;
                console.log('import file name: ', this.formdata.import_file) 

                fetch(`/api/import` , {
                    headers:{
                        'Content-Type': 'application/json',
                        'Authentication-Token':localStorage.getItem('auth-token'),
                    },
                    method: 'post',
                    body: JSON.stringify(this.formdata),
                }).then((resp) => {
                    console.log('Status: ', resp.status)
                    if(resp.status >= 400 && resp.status <= 600){
                        if(resp.status == 400){
                            throw new Error("Import failed...");
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
                    console.log('Post updated', data.message, data.count)
                    alert(data.message);
                    this.$router.push(`/profile/${userid}/${username}`);
                }).catch((err) => {
                    console.log("Error: ", err)
                })
            }
            else{
                alert('Please select any file to import posts')
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
    },
})

export default import_posts;