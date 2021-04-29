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
	
  // 웰컴 메세지, 메모 추가 및 메모 열람 가능
  const messages = await Promise.all([
    conversations.map((conversation) =>
			libKakaoWork.sendMessage({
        conversationId: req.body.message.conversation_id,
        text: '나와의 채팅',
        blocks: [
					{
						type: 'image_link',
						url: 'https://github.com/auaicn/web-fe-study/blob/master/colorbot.png?raw=true',
					},
          {
            type: 'text',
            text: '나와의 채팅 _Bot_ 으로 보다 똑똑하게, 개인 채팅방 메시지를 관리해보세요.\n메세지를 통한 일정 · 알림 등록 기능, 메세지 최신순 열람 기능이 있습니다',
            markdown: true,
          },
          {
            type: 'button',
            text: '메모 추가',
            action_type: 'call_modal',
            value: 'addMemo',
            style: 'primary',
          },
					{
            type: 'button',
            text: '메모 열람',
            action_type: 'submit_action',
						action_name: 'browseMemo',
            value: 'browseMemo 1',
            style: 'default',
          },
        ],
      })
    ),
  ]);

  // 응답값은 자유롭게 작성하셔도 됩니다.
  res.json({
    result: true,
  });
});

router.post('/request', async (req, res, next) => {
  const { message, value } = req.body;
	
	date = new Date(Date.now() + (3600000*9) )  // current Time
	
  switch (value) {
    case 'addMemo':
      // 메모 추가용 모달
      return res.json({
        view: {
  		  title: "메모 추가",
		  accept: "확인",
		  decline: "취소",
		  value: "addMemoResult", 
		  action_name: 'addMemoResult',
		  blocks: [
			{
			  type: "label",
			  text: "⏰ 알림을 받을 *날짜*를 입력해주세요\nex.2017-08-28T17:22:21\n_미입력시, *현재시간*으로 설정됩니다_",
			  markdown: true
			},
			{
			  type: "input",
			  name: "input_date",
			  required: false,
			  placeholder: date.toISOString().split('.')[0]
			},
			{
			  type: "label",
			  text: "첨부 링크를 입력해주세요",
			  markdown: true
			},
			{
			  type: "input",
			  name: "input_link",
			  required: false,
			  placeholder: "https://swmaestro.org/sw/main/main.do"
			},
			{
			  type: "label",
			  text: "메모의 내용을 입력해주세요.(필수)",
			  markdown: true
			},
			{
			  type: "input",
			  name: "input_description",
			  required: false,
			  placeholder: "\n\n\n\n\n"
			}
		  ]
		}
      });
      break;
    default:
  }

  res.json({});
});

router.post('/callback', async (req, res, next) => {
	const { action_name, message, actions, action_time, value } = req.body;

	let currentPageNumber = 0, newValue = value;
	if (value.includes('browseMemo')){
			currentPageNumber = parseInt(value.slice(11));
			newValue = 'browseMemo';
	}
	
	// value 값만 인식
  switch (newValue) {
		case 'browseMemo':
			const conversationId = req.body.message.conversation_id;
			libKakaoWork.showMemos({conversationId, currentPageNumber});
			break;
		case 'home':
			libKakaoWork.sendMessage({
        conversationId: req.body.message.conversation_id,
        text: '나와의 채팅',
        blocks: [
					{
						type: 'image_link',
						url: 'https://github.com/auaicn/web-fe-study/blob/master/colorbot.png?raw=true',
					},
          {
            type: 'text',
            text: '나와의 채팅 _Bot_ 으로 보다 똑똑하게, 개인 채팅방 메시지를 관리해보세요.\n메세지를 통한 일정 · 알림 등록 기능, 메세지 최신순 열람 기능이 있습니다',
            markdown: true,
          },
          {
            type: 'button',
            text: '메모 추가',
            action_type: 'call_modal',
            value: 'addMemo',
            style: 'primary',
          },
					{
            type: 'button',
            text: '메모 열람',
            action_type: 'submit_action',
						action_name: 'browseMemo',
            value: 'browseMemo 1',
            style: 'default',
          },
        ],
      })
			break;
    case 'addMemoResult':
      try{
				var schedule = new Schedule();
				schedule.conversation_id = message.conversation_id;
				schedule.date = actions.input_date
				schedule.content = actions.input_description
				schedule.link = actions.input_link;

				schedule.save(function(err){
					if(err){
						console.error(err) // DB save query 오류
					}
				});
			}catch(err){
				console.error(err) // DB 오류
			}

			console.log("actions",actions)
			console.log("req.body.message",req.body.message)
      libKakaoWork.sendMessage({
        conversationId: message.conversation_id,
  	    text: "메모가 추가되었습니다.",
					blocks: [
				{
					type: "header",
					text: "메모가 추가되었습니다.",
					style: "blue"
				},
				{
					type: "description",
					term: "일시",
					content: {
					type: "text",
					text: actions.input_date,
					markdown: false
					},
					accent: true
				},
				{ 
					type: "text",
					text: actions.input_description,
					markdown: true
				},
				{
					type: "context",
					content: {
					type: "text",
					text: actions.input_link,
					markdown: true
					},
					image: {
					type: "image_link",
					url: "https://img.icons8.com/ios/72/domain.png"
					}
				}
				]
			});
      break;
    default:
  }

  res.json({ result: true });
});

module.exports = router;