$('.show-graph-btn').on('click', function() {
    $('.vote-page-modal-item').fadeIn();
    $.ajax({
        dataType: 'json',
        contentType: 'application/json',
        type: 'GET',
        url: '/get-vote-page-info',
    }).done(function(vote_info) {
        //ページ投票グラフ表示
        let data_label = [];
        let data_color = [];
        for(let i=0;i<=page_total;i++) {
            if(vote_info.userVotePage[i] == 1) {
                data_color[i] = '#9eff9e';
            } else {
                data_color[i] = '#9eceff';
            }
        }
        for(let i=1;i<=page_total;i++) {
            data_label.push(i.toString());
        }
        let ctx = document.getElementById("chart").getContext('2d');
        pageChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: data_label,
                datasets: [
                    {
                        label: "投票数",
                        data: vote_info.voteCount,
                        backgroundColor: data_color,
                    },
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            stepSize: 1,
                        }
                    },
                    xAxes: [{
                        ticks: {
                            stepSize: 1,
                            autoSkip: false,
                            maxRotation: 0,
                            minRotation: 0,
                        },
                        gridLines: {
                            display: false,
                        },
                    }],
                },
                hover: {
                    mode: 'single'
                },
            }
        });

        let page_now = $('.page-now-text').html();
        if(vote_info.userVotePage[page_now-1] == 1) {
            $('.vote-page-container').hide();
            $('.remove-vote-page-container').show();
        } else {
            $('.remove-vote-page-container').hide();
            $('.vote-page-container').show();
        }
    }).fail(function() {
        console.log('通信失敗');
    });
});

$('.vote-page-modal-close-btn, .vote-page-modal-bg').on('click', function() {
    if (pageChart) {
        pageChart.destroy();
    }
    $('.vote-page-modal-item').fadeOut();
});

$('.vote-page-btn').on('click', function() {
    if($(this).hasClass('voted-page')) {
        $('.vote-page-btn').removeClass('voted-page');
        let page_now = $('.page-now-text').html();
        $.ajax({
            dataType: 'json',
            contentType: 'application/json',
            type: 'POST',
            url: '/remove-vote-page',
            data: JSON.stringify({
                page: parseInt(page_now),
            })
        }).done(function() {
            $('.remove-vote-page-container').hide();
            $('.vote-page-container').show();
            $('.vote-page-caption').text('このページに投票する');
            pageVotedInfo[page_now-1] = 0;
        }).fail(function() {
            console.log('通信失敗');
        });
    } else {
        $('.vote-page-btn').addClass('voted-page');
        let page_now = $('.page-now-text').html();
        page_now = parseInt(page_now);
        $.ajax({
            dataType: 'json',
            contentType: 'application/json',
            type: 'POST',
            url: '/vote-page',
            data: JSON.stringify({
                page: page_now,
            })
        }).done(function() {
            $('.vote-page-container').hide();
            $('.remove-vote-page-container').show();
            $('.vote-page-caption').text('このページの投票をやめる');
            pageVotedInfo[page_now-1] = 1;
        }).fail(function() {
            console.log('通信失敗');
        });   
    }
});
