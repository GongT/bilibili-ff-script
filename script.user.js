// ==UserScript==
// @name         B站快进快退脚本
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  一眼盯帧
// @author       GongT
// @match        *://www.bilibili.com/video/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function findPlayer() {
        let player;

        player = document.querySelector('bwp-video');
        if(player && (player.playbackRate || video.getPlaybackRate)) return player;

        player = document.querySelector('video');
        if(player && player.playbackRate) return player;

        return null;
    }

    let video, lastFrame, frameRate = 29;
    let getRate, setRate, setTime, getTime;
    const ctr = document.createElement('div');
    ctr.id = 'ff-script';
    Object.assign(ctr.style, {
        position: 'fixed',
        top: '67px',
        left: '30px',
        zIndex: '1000',
        whiteSpace: 'nowrap',
    });

    if (document.readyState !== 'loading') {
        execute();
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            execute();
        });
    }

    function execute() {
        video = findPlayer();
        if(!video) {
            return alert('快进快退脚本：页面结构改变，无法运行。');
        }

        if(Object.hasOwn(video, 'getPlaybackRate')) {
            getRate = function () {
                return video.getPlaybackRate();
            }
            setRate = function (r) {
                video.setPlaybackRate(r);
            }
        }else{
            getRate = function () {
                return video.playbackRate;
            }
            setRate = function (r) {
                video.playbackRate = r;
            }
        }
        setTime = function (t) {
            try{
                video.currentTime = t;
            }catch(e){
                console.error(e);
            }
            console.log('???',video.currentTime,t);
        }
        getTime = function (t) {
            return video.currentTime;
        }

        document.body.append(ctr);

        createButton('⏪', '减速', decSpeed);
        createButton('▶️', '原速', resetSpeed);
        createButton('⏩', '加速', incSpeed);
        createFrameInput();
        createButton('◀️', '后退一帧', backwardFrame);
        createButton('▶️', '前进一帧', forwardFrame);
        createButton('📸', '截图', screenshot);

        // video.requestVideoFrameCallback(frameHandle);
    }

    function createButton(text, title, handle) {
        const button = document.createElement('button');
        ctr.append(button);
        button.title = title;
        button.textContent = text;
        button.addEventListener('click', handle);
        return button;
    }

    function createFrameInput(){
        const c = document.createElement('label');
        ctr.append(c);

        const inp = document.createElement('input');
        Object.assign(inp.style, {
            width: '8em'
        });
        c.append(inp);
        inp.type = 'number';
        inp.addEventListener('change', () => {
            frameRate = parseFloat(inp.value);
        });
        inp.title='视频帧率（无法可靠探测，在视频右键→统计信息→Resolution最后一部分）';
        inp.value = frameRate;
    }

    function resetSpeed() {
        setRate(1);
    }
    function decSpeed() {
        let r = getRate();
        if(r > 1) r -= 1;
        else r = r/2;
        setRate(r);
    }
    function incSpeed() {
        let r = getRate();
        if(r >= 1) r += 1;
        else if(r>0.5) r = 1;
        else r = r*2;
        setRate(r);
    }

    function oneFrameTime() {
        return 1 / frameRate;
    }
    function backwardFrame(){
        if(!video.paused) video.pause();
        setTime(getTime() - oneFrameTime());
    }
    function forwardFrame(){
        if(!video.paused) video.pause();
        setTime(getTime() + oneFrameTime());
    }
    function screenshot(){
        try{
            const canvas = document.createElement('canvas');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(function(blob) {
                const item = new ClipboardItem({ "image/png": blob });
                navigator.clipboard.write([item]);
            });
        }catch(e){
            console.error(e);
            alert('绘图或者复制失败，检查控制台输出');
        }
    }

    function frameHandle(time, frame) {
        lastFrame = frame;

        if(!window.stop) video.requestVideoFrameCallback(frameHandle);
    }
})();
