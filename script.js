const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)




const app = {
    songs: [
        {
            name: 'Blue',
            singer: 'yung kai',
            image: 'assets/img/Song 1.jpeg',
            music: 'assets/music/Song 1.mp3'
        },
        {
            name: 'Cupid',
            singer: 'FIFTY FIFTY (피프티피프티)',
            image: 'assets/img/Song 2.jpeg',
            music: 'assets/music/Song 2.mp3'
        },
        {
            name: 'Trap Royalty',
            singer: 'Singer 3',
            image: 'assets/img/Song 3.jpeg',
            music: 'assets/music/Song 3.mp3'
        },
        {
            name: 'Supernatural ',
            singer: 'Ariana Grande',
            image: 'assets/img/Song 4.jpeg',
            music: 'assets/music/Song 4.mp3'
        },
        {
            name: 'End Of Beginning',
            singer: 'Djo',
            image: 'assets/img/Song 5.jpeg',
            music: 'assets/music/Song 5.mp3'
        }
            
    ],

    render: function() {
        const htmls = this.songs.map(song => {
            return `
            <div class="song">
                <div class="thumb" style="background-image: url('${song.image}')">
                </div>
                <div class="body">
                    <h3 class="title">${song.name}</h3>
                    <p class="author">${song.singer}</p>
                </div>
                <div class="option">
                    <i class="fas fa-ellipsis-h"></i>
                </div>
            </div>
            `
        })
        $('.playlist').innerHTML = htmls.join('');
    },

    handleEvent: function() {
        const cd = $('.cd');
        const cdWidth = cd.offsetWidth;
        document.onscroll = function() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const newcdWidth = cdWidth - scrollTop;

        cd.style.width = newcdWidth + 'px';
       }
    },
    start: function() {
        this.render();
        this.handleEvent();
    }

}

app.start();
    