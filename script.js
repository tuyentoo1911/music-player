const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)
const header = $('header h2');
const cdthumb = $('.cd-thumb');
const audio = $('#audio');
const cd = $('.cd');
const playBTN = $('.btn-toggle-play');
const player = $('.player');
const progress = $('#progress');
const nextBTN = $('.btn-next');
const prevBTN = $('.btn-prev');
const randomBTN = $('.btn-random');
const app = {
    currentIndex: 0,
    isPlaying: false,
    isRandom: false,
    songs: [
        {
            name: 'Blue',
            singer: 'yung kai',
            image: 'assets/img/Song 1.jpeg',
            music: 'assets/music/Song 1.mp3'
        },
        {
            name: 'Cupid',
            singer: 'FIFTY FIFTY (피프티프티)',
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
        //xử lý CD quay / dừng
        const cdThumbAnimation = cdthumb.animate({
            transform: 'rotate(360deg)'
        }, {
            duration: 10000,
            iterations: Infinity,
            direction: 'normal'
        });
        cdThumbAnimation.pause();
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
        cdThumbAnimation.play();
       }
       // khi song đang tạm dừng
       audio.onpause = function() {
        _this.isPlaying = false;
        player.classList.remove('playing');
        cdThumbAnimation.pause();
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

        // xử lý khi click vào song trong playlist
        $$('.song').forEach((song, index) => {
            song.onclick = function() {
                app.currentIndex = index;
                app.loadCurrentSong();
                audio.play();
                
                // Highlight bài hát đang phát
                app.highlightCurrentSong();
                
                // Hiệu ứng click tạm thời
                song.style.transform = 'scale(0.95)';
                song.style.transition = 'transform 0.1s ease';
                setTimeout(() => {
                    song.style.transform = 'scale(1)';
                }, 100);
            }
        });

        // xử lý khi click vào nút next
        nextBTN.onclick = function() {
            if(_this.isRandom) {    
                _this.randomSong();
                audio.play();
            } else {
                _this.nextSong();
                audio.play();
            }
            // Hiệu ứng tạm thời
            nextBTN.classList.add('active');
            setTimeout(() => nextBTN.classList.remove('active'), 200);
        }
        // xử lý khi click vào nút prev
        prevBTN.onclick = function() {
            if(_this.isRandom) {
                _this.randomSong();
                audio.play();
            } else {
                _this.prevSong();
                audio.play();
            }
            // Hiệu ứng tạm thời
            prevBTN.classList.add('active');
            setTimeout(() => prevBTN.classList.remove('active'), 200);
        }
        // xử lý khi click vào nút random
        randomBTN.onclick = function() {
            _this.isRandom = !_this.isRandom;
            randomBTN.classList.toggle('active', _this.isRandom);
        }
        // xủ lý khi random song
        audio.onended = function() {
            if(_this.isRandom) {
                _this.randomSong();
                audio.play();
            } else {
                _this.nextSong();
                audio.play();
            }
        }
        
    },
    loadCurrentSong: function() {

        header.textContent = this.currentSong.name;
        cdthumb.style.backgroundImage = '';
        cdthumb.style.backgroundImage = `url('${this.currentSong.image}')`;
        audio.src = this.currentSong.music;
    },
    //next song
    nextSong: function() {
        this.currentIndex++;
        if(this.currentIndex >= this.songs.length) {
            this.currentIndex = 0;
        }
        this.loadCurrentSong();
        // Highlight ô nhạc tương ứng
        this.highlightCurrentSong();
    },
    //prev song
    prevSong: function() {
        this.currentIndex--;
        if(this.currentIndex < 0) {
            this.currentIndex = this.songs.length - 1;
        }
        this.loadCurrentSong();
        // Highlight ô nhạc tương ứng
        this.highlightCurrentSong();
    },
    //random song
    randomSong: function() {
        let randomIndex
        do {
            randomIndex = Math.floor(Math.random() * this.songs.length);
        } while (randomIndex === this.currentIndex);
        this.currentIndex = randomIndex;
        this.loadCurrentSong();
        // Highlight ô nhạc tương ứng
        this.highlightCurrentSong();
    },
    // Highlight bài hát hiện tại trong playlist
    highlightCurrentSong: function() {
        $$('.song').forEach((song, index) => {
            if (index === this.currentIndex) {
                song.classList.add('active');
            } else {
                song.classList.remove('active');
            }
        });
    },
    start: function() {
        this.defineProperties();
        this.render();
        this.handleEvent();
        this.loadCurrentSong();
    }


}

app.start();
    