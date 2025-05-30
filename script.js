const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)
const header = $('header h2');
const cdthumb = $('.cd-thumb');
const audio = $('#audio');
const cd = $('.cd');
const playBTN = $('.btn-toggle-play');
const player = $('.player');
const progress = $('#progress');

const app = {
    currentIndex: 0,
    isPlaying: false,
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
        },
      
            
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
    defineProperties: function() {
        Object.defineProperty(this, 'currentSong', {
            get: function() {
                return this.songs[this.currentIndex];
            }
        });
    },
    handleEvent: function() {
        const _this = this;
        const cdWidth = cd.offsetWidth;
        //xử lý phóng to cd
        document.onscroll = function() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const newcdWidth = cdWidth - scrollTop;

        cd.style.width = newcdWidth > 0 ? newcdWidth + 'px' : 0;
        cd.style.opacity = newcdWidth / cdWidth;
       }
       // xử lý khi click vào playlist
       playBTN.onclick = function() { 
            if(_this.isPlaying) {
                audio.pause();
                player.classList.remove('playing');
                _this.isPlaying = false;
            } else {
                audio.play();
                player.classList.add('playing');
                _this.isPlaying = true;
            }
       }
       // khi song đang phát
       audio.onplay = function() {
        _this.isPlaying = true;
        player.classList.add('playing');
       }
       // khi song đang tạm dừng
       audio.onpause = function() {
        _this.isPlaying = false;
        player.classList.remove('playing');
       }
       //khi tiến độ bài hát thay đổi
       audio.ontimeupdate = function() {
        if(audio.duration) {
            const progressPercent = Math.floor(audio.currentTime / audio.duration * 100);
            progress.value = progressPercent;
        }
        //khi click tua bài hát
        progress.onchange = function() {
            const seekTime = (progress.value / 100) * audio.duration;
            audio.currentTime = seekTime;
        }
        
       }
    },
    loadCurrentSong: function() {

        header.textContent = this.currentSong.name;
        cdthumb.style.backgroundImage = '';
        cdthumb.style.backgroundImage = `url('${this.currentSong.image}')`;
        audio.src = this.currentSong.music;

        
    },
    start: function() {
        this.defineProperties();
        this.render();
        this.handleEvent();
        this.loadCurrentSong();
    }

}

app.start();
    