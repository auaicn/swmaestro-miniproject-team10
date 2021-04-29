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
	
  const data = {
    conversation_id: conversationId,
    text,
    ...blocks && { blocks },
  };
		
  const res = await kakaoInstance.post('/v1/messages.send', data);
  return res.data.message;
};
	
const MAX_MEMOS_PER_PAGE = 10

const months = new Array()

months[0] = 'Jan'
months[1] = 'Feb'
months[2] = 'March'
months[3] = 'Apr'
months[4] = 'May'
months[5] = 'June'
months[6] = 'July'
months[7] = 'Aug'
months[8] = 'Sep'
months[9] = 'Oct'
months[10] = 'Nov'
months[11] = 'Dec'

// 메시지 전송 (3)
exports.showMemos = async ({ conversationId, currentPageNumber}) => {

	console.log("currentPageNumber",currentPageNumber)
	let dbEntries = await axios.create({
		baseURL: 'https://swmaestro-miniprojec-igoeb.run.goorm.io',
	}).get(`/getSchedule/${conversationId}`);
	dbEntries = dbEntries.data
	
	const numEntries = dbEntries.length;
	console.log("numEntries",numEntries)
	let maxPageNumber = parseInt(numEntries / MAX_MEMOS_PER_PAGE);
	if (numEntries % MAX_MEMOS_PER_PAGE != 0) {
		maxPageNumber += 1;
	}

	let actualUserMemos = [];
	const startMemoIndex = MAX_MEMOS_PER_PAGE * (currentPageNumber - 1);
	console.log("startMemoIndex",startMemoIndex)
	
	// page 1 of 1 메시지 우측 정렬 formatting 하는 방법
	const pageDescription = `page ${currentPageNumber}/${maxPageNumber}`
	const lenPageDescription = pageDescription.length
	let headerMessage = `과거의 기록들            🐰`
	headerMessage = headerMessage.substr(0,20-lenPageDescription) + pageDescription
	// console.log(headerMessage)
	
	let greetingMessage = []
	if (numEntries === 0){
		greetingMessage = [
			{
				type: 'header',
				text: `과거의 기록들`,
				style: 'red',
			}
		]
	}else {
		greetingMessage = [
			{
				type: 'header',
				text: headerMessage,
				style: 'blue',
			},
			{
				type: 'text',
				text: '*최신순* 으로 정렬된 메시지입니다.\n자세히 보실 메모를 *선택*해주세요 👇🏻',
				markdown: true,
			}
			,
			{
				type: 'divider'
			}
		]
	}
	
	for (let step = startMemoIndex; step < startMemoIndex + MAX_MEMOS_PER_PAGE; step++) {
		if (step < numEntries)
		{
			const dbEntry = dbEntries[step]
			const writtenDateObj = new Date(dbEntry.date)
			const writtenMonth = writtenDateObj.getMonth()
			const writtenDate = writtenDateObj.getDate()
			const writtenYear = writtenDateObj.getFullYear()
			
			const url = 'https://swmaestro-miniprojec-igoeb.run.goorm.io/getSingleChat'
			// const url = `https://www.daum.net/`
			// const url = 'https://www.notion.so/70048db135834f03a5ebdba28d03814e'
			
			// console.log(dbEntry)
			
			let singleMemo = `*${writtenDate} ${months[writtenMonth]} ${writtenYear === 2021?``:`(${writtenYear})`}*`
			// singleMemo += `\n` + `[${dbEntries[step].content}](${url})`
			if(dbEntry.content !== null)
				singleMemo += `\n` + `${dbEntry.content}`
			if(dbEntry.link !== null)
				singleMemo += `\n` + `${dbEntry.link}`
			// singleMemo += `\n` + `[${dbEntries[step].content}](https://www.daum.net/)`
			
			// getSingleChat
			actualUserMemos.push(
				{
					type: 'text',
					text: singleMemo,
					markdown: true,
				}
			);
		}
	}
	
	if (numEntries === 0){
		actualUserMemos.push(
				{
					type: 'text',
					text: `아직 아무런 메모도 없어요🥲 *메모 추가* 버튼을 눌러주세요.`,
					markdown: true,
				}
			);
	}
	
	// 이전, 다음 버튼 부분.
	let varyingButtons = []
	if (currentPageNumber === 1){
		if (numEntries <= 10);
		else
			varyingButtons = [{
				type: 'button',
				text: '이전 메모 >',
				action_type: 'submit_action',
				action_name: 'browseMemo',
				value: `browseMemo ${currentPageNumber + 1}`,
				style: 'primary'
			}]
	}else if (currentPageNumber === maxPageNumber){
		varyingButtons = [{
			type: 'button',
			text: '< 최근 메모 ',
			action_type: 'submit_action',
			action_name: 'browseMemo',
			value: `browseMemo ${currentPageNumber - 1}`,
			style: 'default'
		}]
	}else{
		varyingButtons = [{
			type: 'action',
			elements: [
				{				
					type: 'button',
					text: '< 최근 메모',
					action_type: 'submit_action',
					action_name: 'browseMemo',
					value: `browseMemo ${currentPageNumber - 1}`,
					style: 'default',
				},
				{	
					type: 'button',
					text: '이전 메모 >',
					action_type: 'submit_action',
					action_name: 'browseMemo',
					value: `browseMemo ${currentPageNumber + 1}`,
					style: 'primary'
				}			
			]
		}]
	}

	data = {
		conversation_id: conversationId,
		text: '메모 열람',
		blocks: []
		.concat(greetingMessage)
		.concat(actualUserMemos) 
		.concat(varyingButtons)
		.concat([
			{
				type: 'divider'
			},
			{
				type: 'button',
				text: '기본 화면으로 돌아가기',
				action_type: 'submit_action',
				action_name: 'home',
				value: 'home',
				style: 'default',
			}
		])
	}
	console.log(data)
	
	const res = await kakaoInstance.post('/v1/messages.send', data);
  return res.data.message;
};
