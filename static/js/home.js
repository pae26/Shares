$(function() {
    let page_total = $('.progressbar').data('total-progress');
    const PAGE_TOTAL = parseInt(page_total);
    $('.sticky').draggable({
        containment: '.slide',
    });
    $('.progressbar').css('width', 'calc(1 / ' + page_total + ' * 100%)');
    $('.template-sticky-container').hide();

    //スライド上に新しい付箋を追加
    function newSticky(init, id, color, shape, text, page_now) {
        if(shape == 'left') {
            return '<span class="init-sticky sticky sticky-left sticky-page' + page_now + ' change-color-left-' + color + '" data-sticky-id="' + id + '" data-color="' + color + '" data-shape="' + shape + '">' + '<span class="sticky-text">' + text +'</span></span>';
        }
        else if(shape == 'right') {
            return '<span class="init-sticky sticky sticky-right sticky-page' + page_now + ' change-color-right-' + color + '" data-sticky-id="' + id + '" data-color="' + color + '" data-shape="' + shape + '">' + '<span class="sticky-text">' + text +'</span></span>';
        }
        else {
            return '<span class="init-sticky sticky sticky-page' + page_now + '" data-sticky-id="' + id + '" data-color="' + color + '" data-shape="' + shape + '">' + '<span class="sticky-text">' + text +'</span></span>';
        }
    }

    //既に貼られている付箋をDBから取得して表示
    function loadSticky() {
        $.ajax({
            dataType: 'json',
            type: 'GET',
            url: '/stickies',
        }).done(function(stickies) {
            console.log('通信成功');
            for(let i in stickies) {
                let id = stickies[i]['id'];
                let color = stickies[i]['color'];
                let shape = stickies[i]['shape'];
                let text = stickies[i]['text'];
                let page_now = stickies[i]['page'];
                let x = stickies[i]['location_x'];
                let y = stickies[i]['location_y'];
                let sticky = newSticky(true, id, color, shape, text, page_now);
                $('.slide').append(sticky);
                $('.sticky').draggable({
                    containment: '.slide',
                });
                $('.init-sticky').css({
                    left: x + 'px',
                    top: y + 'px'
                });
                if(page_now != 1) {
                    $('.init-sticky').hide();
                }
                $('.init-sticky').removeClass('init-sticky');
            }
        }).fail(function(){
            console.log('通信失敗');
        })
    }

    //スライドの遷移を制御
    function pageControl(action) {
        let page_now = $('.page-now-text').html();
        page_now = parseInt(page_now);
        if(action == 'next') {
            //最終ページか否かで処理を分岐
            if (page_now == PAGE_TOTAL) {
                $('.fa-chevron-right').css('color', '#C0C0C0');
                $('.slide-button-next').prop('disabled', true);
                return;
            }else if(page_now + 1 == PAGE_TOTAL) {
                $('.fa-chevron-right').css('color', '#C0C0C0');
                $('.slide-button-next').prop('disabled', true);
                $('.sticky-page' + page_now).hide();
            } else {
                $('.fa-chevron-left').css('color', '#fff');
                $('.slide-button-prev').prop('disabled', false);
                $('.sticky-page' + page_now).hide();
            }
            page_now += 1;
        } else if(action == 'prev') {
            //初期ページか否かで処理を分岐
            if (page_now == 1) {
                $('.fa-chevron-left').css('color', '#C0C0C0');
                $('.slide-button-prev').prop('disabled', true);
                return;
            } else if(page_now - 1 == 1) {
                $('.fa-chevron-left').css('color', '#C0C0C0');
                $('.slide-button-prev').prop('disabled', true);
                $('.sticky-page' + page_now).hide();
            } else {
                $('.fa-chevron-right').css('color', '#fff');
                $('.slide-button-next').prop('disabled', false);
                $('.sticky-page' + page_now).hide();
            }
            page_now -= 1;
        }
        let next_jpeg_file_path = '/static/pdf/1/' + page_now + '.jpeg';
        $('.display-page').attr('src', next_jpeg_file_path);
        $('.progressbar').css('width', 'calc(' + page_now + ' / ' + PAGE_TOTAL + ' * 100%)');
        $('.page-now-text').html(page_now);
        $('.sticky-page' + page_now).show();
    }

    //付箋モデルの形を変更した際に、テキストエリアとモデル内の文字をその形に合った文字数に変更
    function changeTextAreaSize(shape) {
        let input_text = $('.create-sticky-textarea').val();
        let textarea_size;
        switch(shape) {
            case 'square':
                textarea_size = 33;
                break;
            case 'rectangle':
                textarea_size = 121;
                break;
            case 'left':
            case 'right':
                textarea_size = 24;
                break;
        }
        if (input_text.length >= textarea_size) {
            input_text = input_text.slice(0, textarea_size);
        }
        $('.create-sticky-textarea').val(input_text);
        $('.create-sticky-model-text').html(input_text);
        $('.create-sticky-textarea').attr('maxlength', '' + textarea_size);
    }

    function loadStikyId(callback) {
        $.ajax({
            dataType: 'json',
            type: 'GET',
            url: '/load-sticky-id',
        }).done(function(id) {
            console.log('通信成功!');
            callback(id);
        }).fail(function() {
            console.log('通信失敗');
            callback(-1);
        });
    }

    function createSticky(page_now, color, shape, text) {
        $.ajax({
            dataType: 'json',
            contentType: 'application/json',
            type: 'POST',
            url: '/create-sticky',
            data : JSON.stringify({
                page: parseInt(page_now),
                color: color,
                shape: shape,
                location_x: 0,
                location_y: 0,
                text: text,
                empathy: 0
            })
        }).done(function() {
            console.log('通信成功');

        }).fail(function() {
            console.log('通信失敗');
        });
    }

    function updateSticy(id, location_x, location_y) {
        $.ajax({
            dataType: 'json',
            contentType: 'application/json',
            type: 'POST',
            url: '/create-sticky',
            data : JSON.stringify({
                id: parseInt(id),
                location_x: parseInt(location_x),
                location_y: parseInt(location_y),
            })
        }).done(function() {
            console.log('通信成功');

        }).fail(function() {
            console.log('通信失敗');
        });
    }


    //初期付箋を読み込み
    loadSticky();

    //スライドの遷移操作
    $('.slide-button-next').on('click', function() {
        pageControl('next');
    });
    $('.slide-button-prev').on('click', function() {
        pageControl('prev');
    });


    //付箋作成モーダルの表示・非表示
    $('.add-sticky-btn').on('click', function() {
        $('.new-sticky-modal-item').fadeIn();
    });
    $('.new-sticky-modal-bg').on('click', function() {
        $('.new-sticky-modal-item').fadeOut();
    });

    $('.create-sticky-title').on('click', function() {
        $('.template-sticky-container').hide();
        $('.create-sticky-container').show();
    });

    $('.template-sticky-title').on('click', function() {
        $('.create-sticky-container').hide();
        $('.template-sticky-container').show();
    });

    //色の変更
    $('[class^=create-sticky-color-]').on('click', function() {
        if($(this).hasClass("selected-color")) {
            return;
        }

        let new_color = $(this).attr('class').replace('create-sticky-color-', '');
        let old_color = $('.create-sticky-model').attr('data-color');
        let shape = $('.create-sticky-model').attr('data-shape');

        $('.create-sticky-model').attr('data-color', new_color);

        //選択表示の切り替え
        $('.selected-color').removeClass('selected-color');
        $(this).addClass('selected-color');

        //矢印付箋の三角形とbeforeをリセット
        $('.create-sticky-model').removeClass('change-color-left-' + old_color);
        $('.create-sticky-model').removeClass('change-color-right-' + old_color);

        if(shape == 'left') {
            $('.create-sticky-model').addClass('change-color-left-' + new_color);
        }
        else if(shape == 'right') {
            $('.create-sticky-model').addClass('change-color-right-' + new_color);
        }
    });

    //形の変更
    $('[class^=create-sticky-shape-]').on('click', function() {
        if($(this).hasClass("selected-shape") || $(this).hasClass("selected-shape-left") || $(this).hasClass("selected-shape-right")) {
            return;
        }
        let shape = $(this).attr('class').replace('create-sticky-shape-', '');
        let color = $('.create-sticky-model').attr('data-color');

        //選択表示を消去
        $('.selected-shape').removeClass('selected-shape');
        $('.selected-shape-left').removeClass('selected-shape-left');
        $('.selected-shape-right').removeClass('selected-shape-right');
        $('.selected-shape-triangle-left').removeClass('selected-shape-triangle-left');
        $('.selected-shape-triangle-right').removeClass('selected-shape-triangle-right');

        //矢印付箋の三角形とbeforeをリセット
        $('.create-sticky-model').removeClass('change-color-left-' + color);
        $('.create-sticky-model').removeClass('change-color-right-' + color);

        if(/square$/.test(shape)) {
            $(this).addClass('selected-shape');
            $('.create-sticky-model').attr('data-shape', 'square');

            changeTextAreaSize('square');
        }
        else if(/rectangle$/.test(shape)) {
            $(this).addClass('selected-shape');
            $('.create-sticky-model').attr('data-shape', 'rectangle');

            changeTextAreaSize('rectangle');
        }
        else if(/left$/.test(shape)) {
            $('.create-sticky-shape-left').addClass('selected-shape selected-shape-left');
            $('.create-sticky-shape-triangle-left').addClass('selected-shape-triangle-left');

            $('.create-sticky-model').attr('data-shape', 'left');
            $('.create-sticky-model').addClass('change-color-left-' + color);

            changeTextAreaSize('left');
        }
        else if(/right$/.test(shape)) {
            $('.create-sticky-shape-right').addClass('selected-shape selected-shape-right');
            $('.create-sticky-shape-triangle-right').addClass('selected-shape-triangle-right');

            $('.create-sticky-model').attr('data-shape', 'right');
            $('.create-sticky-model').addClass('change-color-right-' + color);

            changeTextAreaSize('right');
        }
    });

    $(document).on('input', '.create-sticky-textarea', function() {
        $('.create-sticky-model-text').text($('.create-sticky-textarea').val());
    });

    $('.template-sticky-title').on('click', function() {
        $(this).addClass('selected-title');
        $('.create-sticky-title').removeClass('selected-title');
        $('.new-sticky-btn').removeClass('create-mode');
        $('.new-sticky-btn').addClass('template-mode');
    });

    $('.create-sticky-title').on('click', function() {
        $(this).addClass('selected-title');
        $('.template-sticky-title').removeClass('selected-title');
        $('.new-sticky-btn').removeClass('template-mode');
        $('.new-sticky-btn').addClass('create-mode');
    });

    //新しい付箋の作成
    $('.new-sticky-btn').on('click', function() {
        let id;
        let callback = function(result) {
            console.log('result:' + result);
            id = result;
            console.log(id);

            if($('.new-sticky-btn').hasClass('create-mode')) {
                let color = $('.create-sticky-model').attr('data-color');
                let shape = $('.create-sticky-model').attr('data-shape');
                let text = $('.create-sticky-model-text').text();
                let page_now = $('.page-now-text').html();
                let sticky = newSticky(false, id+1, color, shape, text, page_now);
                $('.slide').append(sticky);
                createSticky(page_now, color, shape, text);
            }
            else if($('.new-sticky-btn').hasClass('template-mode')) {
                let color = $('.selected-template').data('color').replace('light-', '');
                let shape = $('.selected-template').data('shape');
                let text = $('.selected-template > .template-sticky-text').text();
                let page_now = $('.page-now-text').html();
                let sticky = newSticky(false, id+1, color, shape, text, page_now);
                $('.slide').append(sticky);
                createSticky(page_now, color, shape, text);
            }
    
            $('.sticky').draggable({
                containment: '.slide',
            });
            $('.init-sticky').css({
                left: 0,
                top: 0
            });
            $('.init-sticky').removeClass('init-sticky');

            $('.new-sticky-modal-item').fadeOut();
        }
        loadStikyId(callback);
    });

    $("[class^='template-sticky-model-']").on('click', function() {
        $('.selected-template').removeClass('selected-template');
        $(this).addClass('selected-template');
    });
});