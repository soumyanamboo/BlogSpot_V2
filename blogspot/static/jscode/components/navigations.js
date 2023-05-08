const navigations = Vue.component('navigations', {
    template: `
        <div>
            <router-link :to="{name:'feeds', params:{userid:this.userid}}" class="navitems" style="color: blue;"> Home  </router-link> |
            <router-link :to="{name: 'profile', params:{prof_userid: this.userid, prof_username: this.username}}" class="navitems" style="color: blue;"> Profile  </router-link> |
            <router-link to="/search" class="navitems" style="color:blue;"> Search  </router-link> |
            <a href="" class="navitems" style="color:blue;" @click.prevent="logout"> Logout  </a>
    </div>
    `,
    data() {
        return {
            userid: 0,
            username: '',
        }
    },
    methods:{
        async logout(){
            if (window.confirm("Do you really want to logout ?")) {
                const res = await fetch('/logout')
                if(res.ok){
                    localStorage.clear()
                    this.$router.push('/')
                }
                else{
                    console.log("cannot logout")
                }
            }
        }
    },
    computed : {
    },
    mounted() {
        this.userid = localStorage.getItem('userid');;
        this.username = localStorage.getItem('username');
    }
})

export default navigations;