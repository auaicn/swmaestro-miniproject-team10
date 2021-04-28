const cron = require('node-cron');
const Schedule = require('../models/schedule');
const libKakaoWork = require('../libs/kakaoWork');

exports.cronAlarmJob = () => {
  // 매 00분 30초마다 실행
  cron.schedule('30 * * * * *', async ()=> {

    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 9);

    Schedule.find({
      date:{$gte:new Date(Date.now() + (3600000*9) - 1000 * 60 * 2),
        $lt:new Date(Date.now() + (3600000*9) + 1000 * 60 * 2)} //한국시간 앞뒤 2분
      },function(err,schedules){
      if(err) {
        console.log(`cron error: '${err}'`);
      }
      
      schedules.map(schedule => sendMessage(schedule, startTime))
    })
  })
}

const sendMessage = (schedule, startTime) => {
  scheduleTime = dateToString(schedule.date);
  startTime = dateToString(startTime);

  if(scheduleTime.substring(0, 16) === startTime.substring(0,16)){
    libKakaoWork.sendMessage({
        conversationId: schedule.conversation_id,
          "text": "Push alarm message",
          "blocks": [
            {
                  "type": "header",
                  "text": "알림이 있습니다!",
                  "style": "blue"
            },
            {
                  "type": "description",
                  "term": "일시",
                  "content": {
                    "type": "text",
                    "text": dateToDisplayString(schedule.date),
                    "markdown": false
                },
                  "accent": true
            },
            {
              "type": "text",
              "text": schedule.content,
              "markdown": true
            },
            {
              "type": "context",
              "content": {
                "type": "text",
                "text": schedule.link,
                "markdown": true
              },
              "image": {
                "type": "image_link",
                "url": "https://t1.kakaocdn.net/kakaowork/resources/block-kit/context/zip@3x.png"
              }
            }
          ]
      })
    }
}

const dateToString = (date, glue="-") => {
  const yyyy = date.getFullYear();
  const mm = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1); // getMonth() is zero-based
  const dd  = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
  const hh = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
  const min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
  return "".concat(yyyy).concat(glue).concat(mm).concat(glue).concat(dd).concat("T").concat(hh).concat(":").concat(min);
}

const dateToDisplayString = (date) => {
  const yyyy = date.getFullYear();
  const mm = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1); // getMonth() is zero-based
  const dd  = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
  const hh = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
  const min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
  return `${yyyy}년 ${mm}월 ${dd}일\n${hh}시 ${min}분`
}