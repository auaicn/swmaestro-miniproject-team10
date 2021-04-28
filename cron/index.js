const cron = require('node-cron');
const Schedule = require('../models/schedule');

exports.cronAlarmJob = () => {
  cron.schedule('30 * * * * *', ()=> {
      const now = new Date();
      
      now.setHours(now.getHours() + 9);
  
      Date.prototype.yyyymmddhhmm = function(glue) {
        if(glue == null) {
          glue = "-";
        }
        let yyyy = this.getFullYear();
        let mm = this.getMonth() < 9 ? "0" + (this.getMonth() + 1) : (this.getMonth() + 1); // getMonth() is zero-based
        let dd  = this.getDate() < 10 ? "0" + this.getDate() : this.getDate();
        let hh = this.getHours() < 10 ? "0" + this.getHours() : this.getHours();
        let min = this.getMinutes() < 10 ? "0" + this.getMinutes() : this.getMinutes();
        return "".concat(yyyy).concat(glue).concat(mm).concat(glue).concat(dd).concat("T").concat(hh).concat(":").concat(min);
      };
  
      console.log(now.yyyymmddhhmm());
      
      const table = {
          conversation_id : "1153118",
          date : '2021-04-27T23:18:00',
          content : "확인용",
          link: "https://www.naver.com"
      };
      
      Schedule.find({ date:{$gte:new Date(Date.now() + (3600000*9) - 1000 * 60 * 60),
          $lt:new Date(Date.now() + (3600000*9) + 1000 * 60 * 60)} //한국시간 앞뒤 1시간
        },function(err,schedules){
        if(err) return res.status(500).json({error:err});
        if(!schedules) return res.status(404).json({error: 'schedules not found'});
        res.json(schedules);
      })
      /*
      이 구간에서 db에서 table을 가져오거나 하면 될 것 같습니다.
      
      */
      
      console.log(table.date.substring(0,16));
       
      if(table.date.substring(0, 16)===now.yyyymmddhhmm().substring(0,16)){
          
      libKakaoWork.sendMessage({
          conversationId: table.conversation_id,
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
                      "text": table.date,
                      "markdown": false
                  },
                    "accent": true
              },
              {
                "type": "text",
                "text": table.content,
                "markdown": true
              },
              {
                "type": "context",
                "content": {
                  "type": "text",
                  "text": table.link,
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
  })
}
