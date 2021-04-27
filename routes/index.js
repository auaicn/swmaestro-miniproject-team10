// routes/index.js
const express = require('express');
const router = express.Router();

const libKakaoWork = require('../libs/kakaoWork');
const Schedule = require('../models/schedule');

router.get('/getSchedule/:conversation_id', function(req,res){
  Schedule.find({conversation_id: req.params.conversation_id},function(err,schedules){
    if(err) return res.status(500).json({error:err});
    if(!schedules) return res.status(404).json({error: 'schedules not found'});
    console.log(schedules);
    res.json(schedules);
  }).sort({date:1})
});

router.post('/createSchedule',function(req,res){
  var schedule = new Schedule();
  schedule.conversation_id =req.body.conversation_id;
  var kor_date = new Date(req.body.date);
  kor_date = kor_date.getTime()+(3600000*9);

  schedule.date = kor_date; //date가 없을 시 예외처리

  schedule.content = req.body.content;
  schedule.link = req.body.link;

  schedule.save(function(err){
    if(err){
        console.error(err);
        res.json({result: 0});
        return;
    }
    res.json({result: 1});
  });
})

router.get('/isAlarm/:conversation_id', function(req,res){
  Schedule.find({conversation_id: req.params.conversation_id, 
    date:{$gte:new Date(Date.now() + (3600000*9) - 1000 * 60 * 60),
      $lt:new Date(Date.now() + (3600000*9) + 1000 * 60 * 60)} //한국시간 앞뒤 1시간
    },function(err,schedules){
    if(err) return res.status(500).json({error:err});
    if(!schedules) return res.status(404).json({error: 'schedules not found'});
    res.json(schedules);
  })
});

router.get('/', async (req, res, next) => {
  // 유저 목록 검색 (1)
  const users = await libKakaoWork.getUserList();

  // 검색된 모든 유저에게 각각 채팅방 생성 (2)
  const conversations = await Promise.all(
    users.map((user) => libKakaoWork.openConversations({ userId: user.id }))
  );

  // 생성된 채팅방에 메세지 전송 (3)
  const messages = await Promise.all([
    conversations.map((conversation) =>
      libKakaoWork.sendMessage({
        conversationId: conversation.id,
        text: '나와의 채팅',
        blocks: [
          {
            type: 'header',
            text: '나와의 채팅',
            style: 'blue',
          },
          {
            type: 'text',
            text: '반갑습니다!\n메모 옵션을 선택해주세요.',
            markdown: true,
          },
          {
            type: 'button',
            action_type: 'call_modal',
            value: 'addMemo',
            text: '메모 추가',
            style: 'default',
          },
					{
            type: 'button',
            action_type: 'call_modal',
            value: 'browseMemo',
            text: '메모 열람',
            style: 'default',
          },
        ],
      })
    ),
  ]);

  // 응답값은 자유롭게 작성하셔도 됩니다.
  res.json({
    users,
    conversations,
    messages,
  });
});

router.post('/request', async (req, res, next) => {
  const { message, value } = req.body;

  switch (value) {
    case 'addMemo':
      // 설문조사용 모달 전송
      return res.json({
        view: {
          title: 'modal title',
          accept: '확인',
          decline: '취소',
          value: 'addMemoResult',
          blocks: [
            {
              type: 'label',
              text: '알림을 받을 날짜를 입력해주세요.',
              markdown: true,
            },
            {
              type: 'label',
              text: '예: 2017-08-28 17:22:21',
              markdown: true,
            },
            {
              type: 'input',
              name: 'input_date',
              required: false,
              placeholder: '날짜를 입력해주세요',
            },
						{
              type: 'label',
              text: '메모의 내용을 입력해주세요.',
              markdown: true,
            },
            {
              type: 'input',
              name: 'input_description',
              required: false,
              placeholder: '내용을 입력해주세요',
            },
						{
              type: 'label',
              text: '첨부 링크를 입력해주세요.',
              markdown: true,
            },
            {
              type: 'input',
              name: 'input_link',
              required: false,
              placeholder: '링크르 확인해주세요',
            },
          ],
        },
      });
      break;
    default:
  }

  res.json({});
});


// routes/index.js
router.post('/callback', async (req, res, next) => {
  const { message, actions, action_time, value } = req.body; // 설문조사 결과 확인 (2)

  switch (value) {
    case 'addMemoResult':
      // 설문조사 응답 결과 메세지 전송 (3)
      await libKakaoWork.sendMessage({
        conversationId: message.conversation_id,
        text: '메모가 추가되었습니다!',
        blocks: [
          {
            type: 'text',
            text: '추가된 메모',
            markdown: true,
          },
          {
            type: 'text',
            text: '추가하신 메모입니다',
            markdown: true,
          },
          {
            type: 'description',
            term: '시간',
            content: {
              type: 'text',
							text: "2020년 9월 16일 7시",
              markdown: false,
            },
            accent: true,
          },
          {
            type: 'description',
            term: '메모 내용',
            content: {
              type: 'text',
							text: "[임시] Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum enim nisi, ultrices ac blandit et",							
              markdown: false,
            },
            accent: true,
          },
					{
						type: 'context',
						content: {
              type: 'text',
              text: "[관련 링크](https://www.naver.com/)",
              markdown: true,
            },
						image:{
							type:'image_link',
url:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADgCAMAAADCMfHtAAAAclBMVEUhxgMfxwL///8ExACz5q9M0Ds5zCjf+dvs++n9//x52m74/vdf1EwAxQCP4YOk55nm+eL0/fKg4ppIzzNQ0EFw2WNm11l+3HN222kuyxza9tas6aO166y87bWI3nxT0UXE772U4orM8cWr6qGb5JHV9dBTaNN7AAADAklEQVR4nO3bXW/aQBCF4d2ZAiZmA4kJhoaPhKT//y/WNFJU1ev1SpjiMzrvJfGFH83ayUTCiZTPlTNa9VyKk8LrvW/kdmkonFT+3rdx09ZuZniCX/2gED4K8aMQPwrxoxA/CvGjED8K8aMQPwrxoxA/CvGjED8K8aMQPwrxoxA/CvGjED8K8aMQPwrxoxA/CvGjED8K8aMQPwrxoxA/CvGjED8K8aMwK3+bBrgzR2FmFFJI4VVRmBWFFFJ4VUMLNV5U0HfpAHfmhhe+PESqNyECnNSxa7e7cQunM5m3k6dNe4r6GL20mOiYha4RRvu5awnDY/TKkQt9l1BeW0O0Jiy3/xIxhZ2nVGRWBQvC7hmK7E3MMCWc12pcKKu14gsTz2HTweELkzOU+VGNC2V1UuNCeXPWhfIewIXpN83l/heKLeydoZx31oWyVOvC71URU9j7HMplVXTAwowZfq+KhoXlixoXymyqsMKc57BpH2CFeTOU8kGNC2VVqXGhHIJ1YbMqYgoz3zRfEEhh9gybVdG8UI61JWEZo7wiCruew49z5MM5orBrhp+np+jndoRL/TQvdGfjwqCLwoSw602zDF7fTQi7Z9j87M26UNcr40Kvx/hvQDtC7w/4wsSb5jLEKuOcjlzYM0OtY3+gWhJ63aML06fU+9C/XY1c2DdDr9u+c4ou9BrfCi0Jp7+ghX3P4YW4Sa+KIxf2z7AhpldFA0K/O1sXpldFC8L0qjhyYcab5s85TayKIxfmzdCHU/c5tSH04WhdmFgVrQh10rUqjlyY+aa5EOuOf2mYEfrQsSqOXNic0nnZLibsuLRcjVzoTotYVRvofRW9dPHXiRik//PtvBgQ9dt5QzbAnTkKM6OQQgqvisKsKKSQwquiED8K8aMQPwrxoxA/CvGjED8K8aMQPwrxoxA/CvGjED8K8aMQPwrxoxA/CvGjED8K8aMQPwrxoxA/CvGjED8K8aMQPwrxoxA/CvGjED8K8aMQv5l5oUzvfQe3beKkcAN933aU+eI3BUZLMIBgBm4AAAAASUVORK5CYII='
						}
					}
        ],
      });
      break;
    default:
  }

  res.json({ result: true });
});

module.exports = router;