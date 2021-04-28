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
	
	// dbentries = []
	// const numEntries 
	// maxPageNumber = Math.floor( numEntries/ MAX_MEMOS_PER_PAGE) // 10 으로 나눠준다.
	// 50개면 5페이지 나오고 49개면 5페이지 나온다.
	// 0-10 -> 1페이지
	// 11-20 -> 2페이지 
	// floor 하는데, -1 해서 floor 해줘야 할듯. 0이었을때는 예외 처리 해주자.
	// array1.forEach(element => console.log(element));
	
	currentPageMemos = [] // <- for 문 돌면서 출력해준다.

	// sorting
	// 현재 /10 한다 urrentPageNumber 
	
	const maxPageNumber = 4 // 전체 메세지 개수에 따른, 현재 페이지를 표시하기 위함이다. db 를 계속 봐야 하는것을 피할 수 없는데, 사용성이라도 높이려고 넣었습니다.
	const actualUserMemos = []
	
	for (step = 0; step < 8; step++) {
		actualUserMemos.push(
			{
				type: 'text',
				text: '_text sample_ *link 🔗*',
				markdown: true,
			}
		)
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
