/**
 * Petal Log 易用性測試 — 自助填寫版 Google 表單產生器
 *
 * 對應文件：USABILITY_TEST_PLAN.md v1.1（原本設計給有主持人在場的測試流程，
 * 這份腳本把同樣的 11 個任務 + 測後問卷改寫成「朋友自己操作、自己填答」的
 * 無主持人版本：拿掉 think-aloud／觀察員記錄，改成任務後的自陳式問題。
 *
 * 使用方式：
 * 1. 開啟 https://script.google.com/ → 新增專案
 * 2. 把這個檔案整份貼進去，取代預設的 Code.gs 內容
 * 3. 上方函式選單選 createUsabilityTestForm，點執行（▶）
 * 4. 第一次執行會跳出 Google 帳號授權，允許即可（這是在幫你的帳號建立表單）
 * 5. 執行完成後，到「執行紀錄」查看兩個連結：
 *    - 編輯連結：自己先預覽、調整
 *    - 填寫連結：分享給朋友填寫
 * 6. 朋友的回覆會自動存在表單內建的「回覆」分頁；也可以在那裡點
 *    「建立試算表」匯出成 Google Sheet 方便統計
 *
 * 記得先把下面 APP_URL 改成你實際要朋友測試的網址（預設是 GitHub Pages 正式站）。
 */

const APP_URL = 'https://lolalayaya.github.io/Petal-Log/'

const STANDARD_COMPLETION = [
  '完全獨立完成，沒有卡住',
  '嘗試了幾次、繞了一點路，但自己完成',
  '找了很久／上網查／問了人才完成',
  '沒有完成',
]

const OPTIONAL_FEATURE_COMPLETION = [
  '完全獨立完成，沒有卡住',
  '嘗試了幾次、繞了一點路，但自己完成',
  '找了很久／上網查／問了人才完成',
  '沒有完成',
  '畫面上完全沒看到這個功能（直接跳過這題）',
]

const TASKS = [
  {
    title: 'Task 1：初次開啟與引導',
    prompt:
      '請打開上一頁的 App 網址，把你看到的畫面當作「第一次使用」，照你覺得對的方式操作下去，直到你覺得自己進入了主畫面為止。',
    extraQuestions: [
      {
        type: 'choice',
        title: '設定過程中，「平均經期天數」與「大約幾天來一次」這兩個問題，你覺得好懂嗎？',
        choices: ['很清楚，一看就懂', '要想一下才懂', '看不太懂在問什麼'],
        required: true,
      },
    ],
  },
  {
    title: 'Task 2：記錄今天的經期',
    prompt: '假設你今天經期來了，請把它記錄下來。',
    extraQuestions: [
      {
        type: 'choice',
        title: '你有在 10 秒內找到「記錄」的入口嗎？',
        choices: ['有，馬上就看到', '找了一下才看到', '沒有在 10 秒內找到'],
        required: true,
      },
    ],
  },
  {
    title: 'Task 3：看懂週期預測資訊',
    prompt:
      '現在請看一下畫面最上方的幾張資訊卡片（第幾天／預計下次／易孕期等），試著用自己的話說說看，你從這幾張卡片看懂了什麼。',
    extraQuestions: [
      {
        type: 'text',
        title: '請簡單描述一下，你看到的卡片分別代表什麼意思（猜的也沒關係，寫下你當下的理解）',
        required: true,
      },
      {
        type: 'choice',
        title: '「易孕期」卡片下方那行小字提示，你有注意到嗎？看完會不會誤以為是精準的醫療數據？',
        choices: ['有注意到，也清楚這只是估算、不是醫療建議', '有注意到，但不確定是不是很準', '沒注意到有這行字'],
        required: true,
      },
    ],
  },
  {
    title: 'Task 4：補記錄與修改紀錄',
    prompt:
      '假設你發現上禮拜有一天忘記記錄了，請幫忙補上去；然後再假設你記錯經量了，請把它改掉。',
    extraQuestions: [
      {
        type: 'choice',
        title: '你能分辨月曆上「已記錄的日期」跟「預測日期」的顏色差異嗎？',
        choices: ['可以，一眼就看得出差異', '要仔細看才看得出來', '看不出差異'],
        required: true,
      },
    ],
  },
  {
    title: 'Task 5：找到症狀記錄功能',
    prompt:
      '如果這次經期有一些不舒服的症狀想記錄下來，比如頭痛或經痛，請試著找找看這個 App 能不能做到（這個功能預設是關閉的，需要自己找）。',
    completionChoices: OPTIONAL_FEATURE_COMPLETION,
    extraQuestions: [
      {
        type: 'text',
        title: '你第一直覺會先去哪裡找這個功能？（例如：設定裡／記錄畫面裡／其他地方）為什麼？',
        required: true,
      },
    ],
  },
  {
    title: 'Task 6：記錄自訂症狀與備註',
    prompt:
      '請在剛剛那個症狀選單裡，新增一個 App 沒有提供、但你想記錄的症狀；然後再用「其他」欄位寫一段文字備註。',
    completionChoices: OPTIONAL_FEATURE_COMPLETION,
    extraQuestions: [
      {
        type: 'choice',
        title: '你覺得「其他」（單次寫的備註）跟「新增自訂症狀」（永久多一個選項）這兩件事，容易搞混嗎？',
        choices: ['不會，兩者定位很清楚', '一開始有點混淆，後來懂了', '會，到最後還是分不清楚'],
        required: true,
      },
    ],
  },
  {
    title: 'Task 7：找到週期階段顏色設定',
    prompt:
      '這個 App 可以在月曆上用不同顏色標出「月經期、濾泡期、排卵期、黃體期」四個生理階段，請試著把這個功能打開。',
    completionChoices: OPTIONAL_FEATURE_COMPLETION,
    extraQuestions: [
      {
        type: 'choice',
        title: '打開後回到月曆，你有注意到日期格子上方出現的細色條嗎？',
        choices: ['有，很明顯', '有，但要仔細看才發現', '沒注意到'],
        required: true,
      },
      {
        type: 'choice',
        title: '「濾泡期」「黃體期」這類名詞，你看得懂意思嗎？',
        choices: ['看得懂', '大概猜得到', '看不懂'],
        required: true,
      },
    ],
  },
  {
    title: 'Task 8：提醒通知與週期圖表統計',
    prompt:
      '如果你希望這個 App 在經期快來之前主動提醒你，請試著把這個功能打開；另外，這個 App 其實有把你的紀錄畫成圖表，也請試著找找看並打開來看。這兩個功能都在設定裡，也都預設是關閉/收合的。',
    skipStandardCompletion: true,
    extraQuestions: [
      {
        type: 'choice',
        title: '你有找到並打開「提醒通知」嗎？（瀏覽器可能會跳出授權提示，如果跳出來，選你想要的即可）',
        choices: OPTIONAL_FEATURE_COMPLETION,
        required: true,
      },
      {
        type: 'choice',
        title: '你知道「提前幾天提醒」這個欄位在設定什麼嗎？',
        choices: ['知道', '猜得到大概', '不知道'],
        required: true,
      },
      {
        type: 'choice',
        title: '你有找到並打開「週期圖表統計」嗎？',
        choices: OPTIONAL_FEATURE_COMPLETION,
        required: true,
      },
      {
        type: 'choice',
        title: '打開圖表後，你看得懂上面在畫什麼嗎？（長條圖的天數、⚠ 符號、經量分佈的顏色分段）',
        choices: ['看得懂', '大概看得懂', '看不太懂'],
        required: true,
      },
    ],
  },
  {
    title: 'Task 9：雲端同步（跨裝置備份）',
    prompt:
      '假設你想讓這些紀錄之後也能在另一支手機或電腦上看到，請試著找找看這個 App 有沒有辦法做到；如果找到了，請照畫面指示試著「建立新同步碼」（不用真的換裝置測試，看到產生的碼、了解怎麼用即可）。\n\n如果設定裡完全沒看到「雲端同步」這個區塊，代表這次測試的版本沒有開放這個功能，下面題目請直接選「畫面上完全沒看到這個功能」，不用勉強找。',
    completionChoices: OPTIONAL_FEATURE_COMPLETION,
    extraQuestions: [
      {
        type: 'choice',
        title: '看到「同步碼」（一串英文字組成的碼）取代一般的帳號密碼登入，你的感覺是？',
        choices: ['很合理，不用記帳號密碼更方便', '還好，兩種都可以接受', '不太習慣，會希望有一般的帳號登入', '沒看到這個功能，不適用'],
        required: true,
      },
      {
        type: 'text',
        title: '如果現在要你換一台手機或電腦，你覺得要怎麼做才能看到一樣的紀錄？（憑直覺猜猜看就好）',
        required: false,
      },
    ],
  },
  {
    title: 'Task 10：查看報表',
    prompt:
      '請試著找找看這個 App 有沒有辦法把你的紀錄整理成一份可以列印出來、或存成 PDF、拿給醫生參考的文件。\n\n（如果畫面上剛好出現「週期不規律」之類的異常提醒橫幅，也請留意一下你看不看得懂那段文字在說什麼；沒有出現也沒關係，不用特地製造異常資料。）',
    extraQuestions: [
      {
        type: 'choice',
        title: '你知道要怎麼把這份報表存成 PDF 嗎？',
        choices: ['知道，用瀏覽器的列印功能就可以', '有點困惑，不確定是不是要用瀏覽器列印', '不知道要怎麼做'],
        required: true,
      },
    ],
  },
  {
    title: 'Task 11：自由探索與整體感受',
    prompt:
      '測試任務就到這邊，最後想請你自由逛一下這個 App，看看還有沒有前面任務沒有提到、但你覺得有趣或在意的地方。',
    skipTimeQuestion: true,
    skipStuckQuestion: true,
    extraQuestions: [
      {
        type: 'text',
        title: '你有自己發現前面任務沒提到的功能或設定嗎？是什麼？',
        required: false,
      },
    ],
  },
]

function addTaskPage(form, task) {
  const pageBreak = form.addPageBreakItem()
  pageBreak.setTitle(task.title)

  form.addSectionHeaderItem().setTitle('情境').setHelpText(task.prompt)

  if (!task.skipStandardCompletion) {
    form
      .addMultipleChoiceItem()
      .setTitle('這個任務你完成的狀況是？')
      .setChoiceValues(task.completionChoices || STANDARD_COMPLETION)
      .setRequired(true)
  }

  if (!task.skipTimeQuestion) {
    form
      .addTextItem()
      .setTitle('大約花了多久？')
      .setHelpText('不用精確，抓個大概就好，例如「30秒」「2分鐘」；覺得很難估計也可以填「不確定」')
  }

  if (!task.skipStuckQuestion) {
    form
      .addScaleItem()
      .setTitle('過程中卡關、猶豫、來回找的次數大概是？')
      .setBounds(0, 5)
      .setLabels('完全沒有卡住', '卡住很多次')
  }

  if (task.extraQuestions) {
    task.extraQuestions.forEach((q) => {
      if (q.type === 'choice') {
        form
          .addMultipleChoiceItem()
          .setTitle(q.title)
          .setChoiceValues(q.choices)
          .setRequired(!!q.required)
      } else {
        form
          .addParagraphTextItem()
          .setTitle(q.title)
          .setRequired(!!q.required)
      }
    })
  }

  form
    .addParagraphTextItem()
    .setTitle('這個過程中，有沒有哪裡讓你猶豫、看不懂、找很久，或反而覺得很順手的地方？')
    .setHelpText('想到什麼寫什麼就好，一兩句話也可以，這段對我們最有幫助')
}

function createUsabilityTestForm() {
  const form = FormApp.create('Petal Log 易用性測試（自助填寫版）')

  form.setDescription(
    '謝謝你願意花時間幫忙測試 Petal Log！這是一款經期記錄工具，接下來會請你照著幾個情境操作，操作完再回來這裡填答。\n\n' +
      '這不是在測試你，是在測試這個產品——如果哪裡卡住、找不到，那是產品設計要改進的地方，不是你的問題，不用有壓力，也不用想「正確答案」。\n\n' +
      '建議事項：\n' +
      '・請用手機或電腦瀏覽器打開下面的網址，建議用「無痕視窗」開啟，這樣才會是全新使用者看到的畫面\n' +
      '・請按任務順序一題一題做，不要先跳著看後面的任務\n' +
      '・如果這個主題讓你不自在，隨時可以跳過某一題或直接停止填寫，都沒關係\n\n' +
      'App 網址：' +
      APP_URL
  )
  form.setCollectEmail(false)
  form.setProgressBar(true)
  form.setConfirmationMessage('填答完成，非常感謝你的幫忙！你的回饋會直接用來改善這個 App。')

  // 第一頁：基本資訊
  form
    .addMultipleChoiceItem()
    .setTitle('你是否曾經使用過其他經期記錄類 App？')
    .setChoiceValues(['有，用過一兩款', '有，用過很多款／持續在用', '沒有，這是我第一次用這類 App'])
    .setRequired(true)

  form
    .addMultipleChoiceItem()
    .setTitle('這次測試你主要用什麼裝置？')
    .setChoiceValues(['手機瀏覽器', '電腦瀏覽器', '平板'])
    .setRequired(true)

  form
    .addTextItem()
    .setTitle('暱稱或代號（方便你自己對照，不需要真實姓名，也可以留空）')
    .setRequired(false)

  TASKS.forEach((task) => addTaskPage(form, task))

  // 最後一頁：測後總結
  const closingPage = form.addPageBreakItem()
  closingPage.setTitle('最後幾題：整體感受')

  const susItems = [
    '我覺得這個 App 很容易上手。',
    '我覺得這個 App 的功能太多、太複雜。',
    '我覺得整個 App 用起來很一致（不會這裡一種邏輯、那裡又一種邏輯）。',
    '我需要別人教我才會用某些功能。',
    '我會想常常使用這個 App。',
  ]
  form.addSectionHeaderItem().setTitle('以下幾句話，請選出你同意的程度').setHelpText('1 = 非常不同意，5 = 非常同意')
  susItems.forEach((statement) => {
    form
      .addScaleItem()
      .setTitle(statement)
      .setBounds(1, 5)
      .setLabels('非常不同意', '非常同意')
      .setRequired(true)
  })

  form
    .addScaleItem()
    .setTitle('你會推薦這個 App 給朋友嗎？（0 = 完全不會，10 = 一定會）')
    .setBounds(0, 10)
    .setLabels('完全不會', '一定會')
    .setRequired(true)

  form
    .addParagraphTextItem()
    .setTitle('整個過程中，哪一步讓你覺得最順手？為什麼？')
    .setRequired(false)

  form
    .addParagraphTextItem()
    .setTitle('哪一步讓你最卡住或猶豫？如果請你形容那個當下的感覺，會怎麼說？')
    .setRequired(false)

  form
    .addParagraphTextItem()
    .setTitle('用一句話，你會怎麼跟朋友介紹這個 App？')
    .setRequired(false)

  form
    .addMultipleChoiceItem()
    .setTitle('如果這是你自己要用的經期記錄工具，你會不會想要資料同步到雲端？')
    .setChoiceValues(['會，希望能跨裝置同步／備份', '不會，只存在自己手機上比較放心', '不確定／看情況'])
    .setRequired(true)

  form
    .addParagraphTextItem()
    .setTitle('上一題選擇的理由是？')
    .setRequired(false)

  form
    .addParagraphTextItem()
    .setTitle('設定裡的「異常提醒」「報表匯出」「提醒通知」這類功能，你會不會實際去用？在什麼情況下你會想用？')
    .setRequired(false)

  PropertiesService.getScriptProperties().setProperty('FORM_ID', form.getId())

  Logger.log('表單建立完成！')
  Logger.log('編輯連結（自己用）：' + form.getEditUrl())
  Logger.log('填寫連結（分享給朋友）：' + form.getPublishedUrl())

  return {
    editUrl: form.getEditUrl(),
    publishedUrl: form.getPublishedUrl(),
  }
}

/**
 * ---------------------------------------------------------------------------
 * 每日回覆同步（方案 A）
 * ---------------------------------------------------------------------------
 * 排程中的 Claude Code 雲端代理所在的執行環境，網路政策不允許直接連到
 * docs.google.com（curl／WebFetch 都會被擋），所以改成反過來：由 Google 這邊
 * 主動把表單原始回覆推回 GitHub repo，雲端代理只需要讀 repo 裡已經有的檔案，
 * 完全不用再連 Google。
 *
 * 一次性設定步驟：
 * 1. 到 GitHub 建立一個 Fine-grained Personal Access Token
 *    （https://github.com/settings/personal-access-tokens/new），
 *    Repository access 只勾選 Lolalayaya/Petal-Log 這一個 repo，
 *    Permissions 只需要 Contents: Read and write，其他都不用給。
 * 2. 回到這個 Apps Script 專案 → 左側齒輪圖示「Project Settings」→
 *    「Script Properties」→ 新增一筆：key 填 GITHUB_TOKEN，value 貼上剛剛
 *    複製的 token（不要把 token 貼進程式碼本身，Script Properties 是給密鑰用的
 *    安全儲存位置，不會出現在原始碼或版本控制裡）。
 * 3. 上方函式選單選 installDailySync，點執行（▶）。第一次執行會多跳一次
 *    Drive 存取授權（用來自動找到表單），允許即可。這個函式會：
 *    - 自動搜尋並記住表單 ID
 *    - 設定每天自動同步一次的觸發器（預設約台北時間早上 6 點，比 Claude
 *      排程的早上 9 點提早 3 小時，確保資料夠新鮮）
 *    - 立刻手動跑一次同步，確認整條路徑（GitHub token 權限、表單存取）沒問題
 * 4. 執行完成後可以到 GitHub 的 Petal-Log repo 檢查有沒有多出一個
 *    .usability-form-responses.json 檔案，內容是目前所有回覆的原始資料。
 *
 * 注意：這個檔案會進到 Petal-Log 這個公開 repo 的 git 歷史，包含每位朋友填寫的
 * 開放式文字回饋（暱稱欄位是選填，不強制真實姓名，但文字回饋本身無法完全匿名）。
 * 如果之後想改成不進公開 repo，需要另外建一個私人 repo 存放這個檔案，
 * 目前先接受這個取捨以求簡單。
 *
 * 如果 Apps Script 的專案時區不是 Asia/Taipei，下面 atHour(6) 對應的實際時間
 * 會跟著時區設定跑掉，可以到 Project Settings 檢查／調整時區。
 */

const GITHUB_REPO = 'Lolalayaya/Petal-Log'
const GITHUB_DATA_PATH = '.usability-form-responses.json'
const GITHUB_BRANCH = 'main'
const FORM_TITLE = 'Petal Log 易用性測試（自助填寫版）'

function findFormIdByTitle_() {
  const files = DriveApp.getFilesByType(MimeType.GOOGLE_FORMS)
  while (files.hasNext()) {
    const file = files.next()
    if (file.getName() === FORM_TITLE) {
      return file.getId()
    }
  }
  throw new Error('找不到標題為「' + FORM_TITLE + '」的表單，如果表單標題被改過，請改用 PropertiesService 手動設定 FORM_ID')
}

function pushJsonToGithub_(path, jsonString, commitMessage) {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN')
  if (!token) {
    throw new Error('缺少 GITHUB_TOKEN，請先到 Project Settings → Script Properties 設定')
  }

  const apiUrl = 'https://api.github.com/repos/' + GITHUB_REPO + '/contents/' + path
  const headers = {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
  }

  let sha = null
  const getResp = UrlFetchApp.fetch(apiUrl + '?ref=' + GITHUB_BRANCH, {
    headers,
    muteHttpExceptions: true,
  })
  if (getResp.getResponseCode() === 200) {
    sha = JSON.parse(getResp.getContentText()).sha
  }

  const payload = {
    message: commitMessage,
    content: Utilities.base64Encode(Utilities.newBlob(jsonString, 'application/json').getBytes()),
    branch: GITHUB_BRANCH,
  }
  if (sha) payload.sha = sha

  const putResp = UrlFetchApp.fetch(apiUrl, {
    method: 'put',
    headers,
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  })

  const code = putResp.getResponseCode()
  if (code !== 200 && code !== 201) {
    throw new Error('推送 GitHub 失敗（HTTP ' + code + '）：' + putResp.getContentText())
  }
  Logger.log('已同步到 GitHub：' + path)
}

function exportResponsesToGitHub() {
  let formId = PropertiesService.getScriptProperties().getProperty('FORM_ID')
  if (!formId) {
    formId = findFormIdByTitle_()
    PropertiesService.getScriptProperties().setProperty('FORM_ID', formId)
  }

  const form = FormApp.openById(formId)

  // 題目未必都會出現在每一筆回覆裡：使用者沒有動過的選填題，
  // getItemResponses() 直接不會產生對應項目（不是回傳空字串），
  // 如果只靠陣列位置對應題目，中間任何一題被跳過都會讓後面全部錯位。
  // 改用每一題在表單裡穩定不變的 item id 當 key，不管有沒有跳過都不會對錯。
  // schema 同時記錄目前表單題目的順序與標題，供人工核對／跟 .gs 腳本的題目順序比對。
  const schema = form
    .getItems()
    .filter(
      (item) => item.getType() !== FormApp.ItemType.PAGE_BREAK && item.getType() !== FormApp.ItemType.SECTION_HEADER
    )
    .map((item, index) => ({ id: item.getId(), order: index, title: item.getTitle() }))

  const formResponses = form.getResponses()
  const responses = formResponses.map((fr) => ({
    timestamp: fr.getTimestamp().toISOString(),
    answers: fr.getItemResponses().map((ir) => {
      const resp = ir.getResponse()
      return {
        itemId: ir.getItem().getId(),
        value: Array.isArray(resp) ? resp.join('; ') : String(resp),
      }
    }),
  }))

  const payload = {
    exportedAt: new Date().toISOString(),
    responseCount: responses.length,
    schema,
    responses,
  }

  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const commitMessage = mm + dd + '_同步易用性測試原始回覆'

  pushJsonToGithub_(GITHUB_DATA_PATH, JSON.stringify(payload, null, 2), commitMessage)
}

function installDailySync() {
  const formId = findFormIdByTitle_()
  PropertiesService.getScriptProperties().setProperty('FORM_ID', formId)

  ScriptApp.getProjectTriggers().forEach((t) => {
    if (t.getHandlerFunction() === 'exportResponsesToGitHub') ScriptApp.deleteTrigger(t)
  })

  ScriptApp.newTrigger('exportResponsesToGitHub').timeBased().everyDays(1).atHour(6).create()

  Logger.log('設定完成，FORM_ID=' + formId + '，每天約台北時間早上 6 點會自動同步一次')

  exportResponsesToGitHub()
  Logger.log('已立刻手動跑過一次同步，去 GitHub 檢查 ' + GITHUB_DATA_PATH + ' 是否出現')
}
