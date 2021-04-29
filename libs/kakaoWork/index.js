// libs/kakaoWork/index.js
const Config = require('config');
const axios = require('axios');

const Schedule = require('../../models/schedule');

const kakaoInstance = axios.create({
  baseURL: 'https://api.kakaowork.com',
  headers: {
    Authorization: `Bearer ${Config.keys.kakaoWork.bot}`,
  },
});

// 유저 목록 검색 (1)
exports.getUserList = async () => {
  const res = await kakaoInstance.get('/v1/users.list');
  return res.data.users;
};

// 채팅방 생성 (2)
exports.openConversations = async ({ userId }) => {
  const data = {
    user_id: userId,
  };
  const res = await kakaoInstance.post('/v1/conversations.open', data);
  return res.data.conversation;
};

// 메시지 전송 (3)
exports.sendMessage = async ({ conversationId, text, blocks }) => {
	
	console.log(...blocks)
	console.log({blocks})
	
  const data = {
    conversation_id: conversationId,
    text,
    ...blocks && { blocks },
  };
		
	console.log(data)	
		
  const res = await kakaoInstance.post('/v1/messages.send', data);
  return res.data.message;
};
	
function getSchedule(conversationId){
	Schedule.find({conversation_id: req.params.conversationId},function(err,schedules){
    if(err) return res.status(500).json({error:err});
    if(!schedules) return res.status(404).json({error: 'schedules not found'});
    console.log(schedules);
	return schedules;
  }).sort({date:1})
}
	
const MAX_MEMOS_PER_PAGE = 10
// 메시지 전송 (3)
exports.showMemos = async ({ conversationId, currentPageNumber}) => {

	console.log("currentPageNumber",currentPageNumber)
	// getSchedule()
	// database(mongod) 와 통신하는 부분 
	// 1. conversation Id 를 가지고 전체 서치
	// 2. 시간순 정렬
	// 3. 현재 인덱스로 잘라서 출력
	const dbEntries = getSchedule(conversationId);
	const numEntries = dbEntries.length;
	const maxPageNumber = parseInt(numEntries / MAX_MEMOS_PER_PAGE);

	let actualUserMemos = [];
	const startMemoIndex = MAX_MEMOS_PER_PAGE * (currentPageNumber - 1);
	
	for (let step = startMemoIndex; step < startMemoIndex + MAX_MEMOS_PER_PAGE; step++) {
		if (step < numEntries)
		{
			actualUserMemos.push(
				{
					type: 'text',
					text: `${dbEntries[step].content}`,
					markdown: true,
				}
			);
		}
	}
	
	// 이전, 다음 버튼 부분.
	let varyingButtons = {}
	if (currentPageNumber === 1){
		varyingButtons =  {
			type: 'button',
			text: '이전 메모 >',
			action_type: 'submit_action',
			action_name: 'browseMemo',
			value: `${currentPageNumber + 1}`,
			style: 'primary'
		}
	}else if (currentPageNumber === maxPageNumber){
		varyingButtons = {
			type: 'button',
			text: '< 최근 메모 ',
			action_type: 'submit_action',
			action_name: 'browseMemo',
			value: `${currentPageNumber - 1}`,
			style: 'default'
		}
	}else{
		varyingButtons = {
			type: 'action',
			elements: [
				{				
					type: 'button',
					text: '< 최근 메모',
					action_type: 'submit_action',
					action_name: 'browseMemo',
					value: `${currentPageNumber - 1}`,
					style: 'default',
				},
				{	
					type: 'button',
					text: '이전 메모 >',
					action_type: 'submit_action',
					action_name: 'browseMemo',
					value: `${currentPageNumber + 1}`,
					style: 'primary'
				}			
			]
		}
	}

	data = {
		conversation_id: conversationId,
		text: '메모 열람',
		blocks: [
			{
				type: 'header',
				text: `나의 메모 열람 ${currentPageNumber}/${maxPageNumber}`,
				style: 'blue',
			},
			{
				type: 'text',
				text: '_자세히 보시려면 메모를 선택해주세요_',
				markdown: true,
			},
			{
				type: 'divider'
			}
		]
		.concat(actualUserMemos).concat([
			varyingButtons,
			{
				type: 'divider'
			},
			{
				type: 'button',
				text: '기본 화면으로',
				action_type: 'submit_action',
				action_name: 'home',
				value: 'hello',
				style: 'default',
			}
		])
	}
	
	const res = await kakaoInstance.post('/v1/messages.send', data);
  return res.data.message;
};
