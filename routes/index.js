const express = require('express');
const router = express.Router();

const libKakaoWork = require('../libs/kakaoWork');
const Schedule = require('../models/schedule');

var count = 0;

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
  // 웰컴 메세지, 메모 추가 및 메모 열람 가능
  const messages = await Promise.all([
    conversations.map((conversation) =>
      libKakaoWork.sendMessage({
        conversationId: conversation.id,
        text: '반갑습니다, 저는 나와의 채팅봇입니다!',
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
            action_type: 'submit_action',
						action_name: 'browseMemo',
            value: '1',
            text: '메모 열람',
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
  console.log(req.body);
  const { message, value } = req.body;

  switch (value) {
    case 'addMemo':
      // 메모 추가용 모달
      return res.json({
        view: {
  		  title: "메모 추가",
		  accept: "확인",
		  decline: "취소",
		  value: "addMemoResult", 
		  blocks: [
			{
			  type: "label",
			  text: "알림을 받을 날짜를 입력해주세요.",
			  markdown: true
			},
			{
			  type: "label",
			  text: "예: 2017-08-28T17:22:21",
			  markdown: true
			},
			{
			  type: "input",
			  name: "input_date",
			  required: false,
			  placeholder: "날짜를 입력해주세요."
			},
			{
			  type: "label",
			  text: "메모의 내용을 입력해주세요.",
			  markdown: true
			},
			{
			  type: "input",
			  name: "input_description",
			  required: false,
			  placeholder: "내용을 입력해주세요."
			},
			{
			  type: "label",
			  text: "첨부 링크를 입력해주세요.",
			  markdown: true
			},
			{
			  type: "input",
			  name: "input_link",
			  required: false,
			  placeholder: "링크를 입력해주세요."
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
  switch (action_name) {
		case 'browseMemo':
			const conversationId = req.body.message.conversation_id; 
			const currentPageNumber = parseInt(value)
			libKakaoWork.showMemos({conversationId, currentPageNumber})
			break;
		case 'home':
			return libKakaoWork.sendMessage({
        conversationId: req.body.message.conversation_id,
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
            text: '메모 추가',
            action_type: 'call_modal',
            value: 'addMemo',
            style: 'default',
          },
					{
            type: 'button',
            text: '메모 열람',
            action_type: 'submit_action',
						action_name: 'browseMemo',
            value: '1',
            style: 'default',
          },
        ],
      })
			break;
    case 'addMemoResult':
      try{
			var schedule = new Schedule();
				
			// schedule 내부 값 설정
			schedule.conversation_id = message.conversation_id + ++count;
			schedule.date = actions.input_date
			schedule.content = actions.input_description
			schedule.link = actions.input_link;
				
			const status = schedule.save(function(err){
				if(err){
					console.error(err); // DB save 오류
					// res.json({result: 0});
					return;
				}
				// res.json({result: 1});
			});
			console.log(status)
			console.log('DB save OK')
			
		}catch(e){
			// DB 오류
			console.log('DB save rejected')
			console.log(e)
		}

		// 그런데 res.json 은 현재 post /callback 블록에서 switch 문마다 한번씩만 
    	// 메모 추가 결과 채팅방 전송 여기도 약간 바뀐같네요, 제가 주석 조금 추가했습니다! 아 주석만 바뀌었네요~ 예전에 제가 추가한건데 구조가좀ㅇ ㅣ상해서 음
		console.log(actions)
		console.log(req.body.message)
      return await libKakaoWork.sendMessage({
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