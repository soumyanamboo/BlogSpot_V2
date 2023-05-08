const sidebar = Vue.component('sidebar', {
    template: `
    <div>
        <br> <br>
        <H4 style="color: darkblue;"> Welcome <b> {{ user }} </b> ! </H4>	 
        <br>
        <img :src="image_path" width="250" height="150" v-if="image"> 
    </div>    
    `,
    data() {
        return {
            image: true,
        }
    },
    methods: {
    },
    computed : {
        user : function () {
            return localStorage.getItem('username');
        },
        image_path: function(){
            this.image = false;
            let image_name = localStorage.getItem('userimage')
            if(image_name > '' ){
                this.image = true;
                let image_path = '../../../static/' + image_name
                // let image_path = 
                console.log('image in sidebar: ', image_path)
                return image_path
            }            
        }
    },
})

export default sidebar;
