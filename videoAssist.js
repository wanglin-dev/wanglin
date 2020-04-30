 //--------------------------------高拍仪方法-------------------------------------------------

/**
 *是否添加水印
 *1代表是0代表否
 */
var isAddWk = 1;
/**
 *是否增加时间水印
 *0代表否 1是
 */
var isAddTime = 1;
/**
 *水印的类型
 *0: 文字水印, 1:图片水印
 */
var wkType = 0;
/**
 *水印出现的位置
 *0: 左上角; 1:右上角; 2:左下角; 3:右下角; 4:中间
 */
var wkPosition = 0;
/**
 *透明度控制
 *取值范围0-255
 */
var transparency = 255;
/**
 *水印图片路径, 格式支持: jpg/bmp/png/jpeg/gif
 */
var wkImagePath = 'C://1.jpg';
/**
 *水印的颜色
 */
var wkColor = 0xffff00;
/**
 *水印的字体
 */
var wkFont = '宋体';
/**
 *宽度
 */
var wkWidth = 40;
/**
 *高度
 */
var wkHeight = 40;
/**
 *是否斜体
 *0否1是
 */
var italic = 0;
/**
 * compressMode 视频压缩率, 0:高; 1:较高; 2:中等;3:较低;4:低，压缩
 * 客户端控件接口说明 压缩率越高, 文件越小，但画面质量越差。
 */
var compressMode = 3;

var EloamGlobal;

var DeviceAssist;
var VideoAssist;
var videoCapAssist;
var AudioObject;

var hasLoadSuccess = 0;

function Load() {
    if (G.localIp == undefined) {
        G.localIp = "127.0.0.1:15962";
    }
    EloamGlobal = document.getElementById("EloamGlobal_ID");
    var ret;
    try {
        ret = EloamGlobal.InitDevs();
    } catch (e) {
        //高拍仪连接成功之后给客户端监控系统发送报告
        alert("连接设备失败" + e);
        $("#stopVideo").attr("disabled", "disabled");
        $.get("http://" + G.localIp + "/easyrecordHS/devstatus",{devstatus: "init_exception"});
        return;
    }
    if (ret) {
        if (!EloamGlobal.VideoCapInit()) {
            alert("初始化录像失败" );
            $.get("http://" + G.localIp + "/easyrecordHS/videoRecode",{videoDevStatus: "init_fail"});
            return;
        }
		hasLoadSuccess = 1;
        setTimeout(function () {
			//判断一次如果没打开摄像头，再打开一次
			if (!VideoAssist)
				OpenVideoAssist();
			
			if (DeviceAssist == null) {
            alert("未检测到录像设备,请连接设备后再进行视频录制");
            $.get("http://" + G.localIp + "/easyrecordHS/videoRecode",{videoDevStatus: "videoDev_null"});
            $("#stopVideo").attr("disabled", "disabled");
				return;
			} else {
				$.get("http://" + G.localIp + "/easyrecordHS/videoRecode",{videoDevStatus: "videoDev_success"});
			}
			if (sino.checkIsNull(G.wkText)) {
				$.ajax({
					url: "/easyRecordHS/business/wkText",
					contentType: "application/json;",
					type: "post",
					success: function (result) {
						if (result.success) {
							console.log(result.data);
							G.officeCode=result.data.officeCode;
							G.bankCode=result.data.bankCode;
							G.wkText = result.data.bankCode + "  " + result.data.officeCode;
						}
					}
				});
			}
			video.video.videoName = videoName;
			var path=sino.getPath("video")+videoName;
			video.video.url = path + "//" + video.video.videoName + ".mp4";
			video.video.oldUrl = path + "//" + video.video.videoName  + "old.mp4";
			sino.createDirectory(path);
			
        }, 3000);

    } else {
        alert("连接设备失败, [ret null]");
        $.get("http://" + G.localIp + "/easyrecordHS/devstatus",{devstatus: "init_failed"});
        return;
    }
   
    setTimeout(function () {
        EnableDate();
        AddText();
    }, 10000);
    //  alert(videoCapAssist.VideoCapGetState());//获取当前录制状态
}

function Unload() {
    if (videoCapAssist && videoCapAssist.VideoCapStop()) {
        videoCapAssist.Destroy();
        videoCapAssist = null;
        if(!sino.checkIsNull(AudioObject)){
            EloamGlobal.StopAudioVolume(AudioObject);
            AudioObject.Destroy();
        }
    }
    if (VideoAssist) {
        ViewAssist.SetText("", 0);
        VideoAssist.Destroy();
        VideoAssist = null;
    }
    if (videoCapAssist) {
        videoCapAssist.Destroy();
        videoCapAssist = null;
    }
    if (DeviceAssist) {
        DeviceAssist.Destroy();
        DeviceAssist = null;
    }
    if (EloamGlobal) {
        EloamGlobal.DeinitDevs();//关闭全局对象
        EloamGlobal = null;
    }

}

function EnableDate() {

    var offsetx = 800;
    var offsety =60;

    var font;
    font = EloamGlobal.CreateTypeface(80, 80, 0, 0, 2, 0, 0, 0, "黑体");

    if (VideoAssist) {
        VideoAssist.EnableDate(font, offsetx, offsety, 000000, 0);
    }
    font.Destroy();
}


function AddText() {
    var font;
    font = EloamGlobal.CreateTypeface(80, 80, 0, 0, 2, 0, 0, 0, "黑体");
    if (VideoAssist) {
        VideoAssist.EnableAddText(font, 0, 60, G.wkText, 000000, 0);
    }
    font.Destroy();
}

function AssistRecord() {
    if (VideoAssist) {
         var videoOutputWidth =1280;
         var videoOutputHeight =720;
        //录像时，打开视频的分辨率越低，帧率越高,一般不超过200w像素
        //所设置的帧率应尽可能高于实际帧率，避免丢帧
        var FrameRate = 15;//此参数可根据录像分辨率与机型实际帧率调节
        if (videoCapAssist) {
            videoCapAssist.VideoCapStop();
            videoCapAssist.Destroy();
        }

        videoCapAssist = EloamGlobal.CreatVideoCap();
        if (null == videoCapAssist) {
            alert("创建录像对象失败");
            return;
        }

        var selMicIdx = -1;
        if (EloamGlobal.VideoCapGetAudioDevNum() > 0)//有麦克风
        {
            selMicIdx = 0;
        } else {
           $.get("http://" + G.localIp + "/easyrecordHS/microphone",{devstatus: "no_micphone"});
        }
        var isSuccess = videoCapAssist.VideoCapSetWatermark(isAddWk, isAddTime, wkType, wkPosition, transparency, wkImagePath, G.wkText, wkColor, wkFont, wkWidth, wkHeight, italic);
        //var isSuccess = videoCapAssist.VideoCapSetWatermark(1, 0, 0, 0, 255, "", "录像文字水印",0xffff00, "宋体", 50, 50 ,0);
        if (!videoCapAssist.VideoCapPreCap(video.video.oldUrl, selMicIdx, FrameRate, compressMode, videoOutputWidth, videoOutputHeight)) {
            alert("启动录像失败");
            return;
        }
        if (!videoCapAssist.VideoCapAddVideoSrc(VideoAssist)) {
            alert("添加视频源失败");
            return;
        }

        if (!videoCapAssist.VideoCapStart()) {
            alert("启动录像失败");
            return;
        }
        AudioObject = EloamGlobal.CreateAudio();
        EloamGlobal.StartAudioVolume(videoCapAssist, AudioObject);
    }
}


function OpenVideoAssist() {
    CloseVideoAssist();
    if (DeviceAssist) {
        var mode = document.getElementById('selMode2');
        var modeText = mode.options[mode.options.selectedIndex].text;
        var subtype = (modeText == "YUY2" ? 1 : (modeText == "MJPG" ? 2 : (modeText == "UYVY" ? 4 : -1)));

        // var select2 = document.getElementById('selRes2');
        // var nResolution2 = select2.selectedIndex;
        var nResolution2=2;     //摄像头分辨率模式
        //nResolution2恒生那边是新版高拍仪用2,咋们测试环境旧高拍仪用0
        VideoAssist = DeviceAssist.CreateVideo(nResolution2, subtype);
        if (VideoAssist) {
            // ViewAssist.SetBkColor("5,5,5");
            ViewAssist.SelectVideo(VideoAssist);
            ViewAssist.SetText("打开视频中，请等待...", 0);
            window.setTimeout(function () {
                AssistRecord();
                window.setInterval(function () {
                    time = time + 1;
                }, 1000);
                video.video.beginDate = sino.getDateTime('1');
            }, 3000);

        }
    }
}

function CloseVideoAssist() {
    if (VideoAssist) {
        VideoAssist.Destroy();
        ViewAssist.SetText("", 0);
    }
}
