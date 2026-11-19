import type { Language } from '../shared/profile.mjs'

let language: Language = 'en'
export function setLanguage(value: Language) {
  language = value
}

const entries = `
Play Solo|Main Solo|单人游戏|தனியாக விளையாடு
Play Team|Main Berpasukan|组队游戏|குழுவாக விளையாடு
Sign in|Log masuk|登录|உள்நுழை
Create account|Cipta akaun|创建账号|கணக்கை உருவாக்கு
Username|Nama pengguna|用户名|பயனர்பெயர்
Password|Kata laluan|密码|கடவுச்சொல்
Chef nickname|Nama panggilan cef|厨师昵称|சமையலர் புனைப்பெயர்
Language|Bahasa|语言|மொழி
Profile & outfit|Profil dan pakaian|个人资料与服装|சுயவிவரமும் உடையும்
Your profile|Profil anda|你的个人资料|உங்கள் சுயவிவரம்
Design your chef|Reka cef anda|设计你的厨师|உங்கள் சமையலரை வடிவமைக்கவும்
Save and continue|Simpan dan teruskan|保存并继续|சேமித்துத் தொடரவும்
Traditional clothing|Pakaian tradisional|传统服装|பாரம்பரிய உடை
Chef character|Watak cef|厨师角色|சமையலர் பாத்திரம்
Facial expression|Ekspresi muka|面部表情|முகபாவனை
No clothing|Tanpa pakaian|未穿服装|உடை இல்லை
Blank face|Muka kosong|无表情五官|முக அம்சங்கள் இல்லை
Relaxed hands|Tangan santai|双手放松|தளர்ந்த கைகள்
Hand sign|Isyarat tangan|手势|கை சைகை
Calm|Tenang|平静|அமைதி
Happy|Gembira|开心|மகிழ்ச்சி
Wink|Kenyit mata|眨眼|கண் சிமிட்டு
Worried|Risau|担心|கவலை
Determined|Bertekad|坚定|உறுதி
Sleepy|Mengantuk|困倦|தூக்கக் கலக்கம்
Peace sign|Isyarat damai|比耶|வெற்றி சைகை
Wave|Lambai|挥手|கையசை
Fist|Genggam|握拳|முஷ்டி
Point|Tuding|指向|சுட்டிக்காட்டு
OK sign|Isyarat OK|OK 手势|சரி சைகை
Clothing|Pakaian|服装|உடை
Casual|Kasual|休闲|சாதாரண உடை
Striped shirt|Baju berjalur|条纹上衣|கோடிட்ட சட்டை
Sprout|Pucuk|嫩芽|தளிர்
Fabric colour|Warna kain|布料颜色|துணி நிறம்
Trim colour|Warna hiasan|饰边颜色|கரை நிறம்
Headwear|Penutup kepala|头饰|தலை அலங்காரம்
Chef hat|Topi cef|厨师帽|சமையலர் தொப்பி
Flower|Bunga|花饰|மலர்
No headwear|Tiada penutup kepala|无头饰|தலை அலங்காரம் இல்லை
Save profile|Simpan profil|保存资料|சுயவிவரத்தைச் சேமி
Profile saved|Profil disimpan|资料已保存|சுயவிவரம் சேமிக்கப்பட்டது
Sign out|Log keluar|退出登录|வெளியேறு
Dishes served|Hidangan disaji|已上菜品|பரிமாறிய உணவுகள்
Already have an account?|Sudah ada akaun?|已有账号？|ஏற்கெனவே கணக்கு உள்ளதா?
New player?|Pemain baharu?|新玩家？|புதிய வீரரா?
Sign in to continue.|Log masuk untuk meneruskan.|请登录后继续。|தொடர உள்நுழையுங்கள்.
Incorrect username or password.|Nama pengguna atau kata laluan salah.|用户名或密码错误。|பயனர்பெயர் அல்லது கடவுச்சொல் தவறு.
That username is already taken.|Nama pengguna itu sudah digunakan.|该用户名已被使用。|அந்தப் பயனர்பெயர் ஏற்கெனவே பயன்பாட்டில் உள்ளது.
Back to main page|Kembali ke laman utama|返回主页|முகப்புக்குத் திரும்பு
Settings|Tetapan|设置|அமைப்புகள்
Sound effects|Kesan bunyi|音效|ஒலி விளைவுகள்
Play cues for actions and successful orders.|Bunyi untuk tindakan dan pesanan yang berjaya.|操作及完成订单时播放提示音。|செயல்களுக்கும் முடித்த ஆர்டர்களுக்கும் ஒலி எழுப்பும்.
On|Hidup|开|இயக்கு
Off|Mati|关|அணை
Connected|Bersambung|已连接|இணைக்கப்பட்டது
Connecting…|Sedang menyambung…|正在连接…|இணைக்கிறது…
Find your kitchen|Cari dapur anda|寻找你的厨房|உங்கள் சமையலறையைக் கண்டுபிடி
Choose a nickname, then host a private room or join your friends.|Pilih nama panggilan, kemudian cipta bilik peribadi atau sertai rakan.|选择昵称，然后创建私人房间或加入好友。|புனைப்பெயரைத் தேர்ந்தெடுத்து தனி அறையை உருவாக்குங்கள் அல்லது நண்பர்களுடன் சேருங்கள்.
Create private room|Cipta bilik peribadi|创建私人房间|தனி அறையை உருவாக்கு
or join a friend|atau sertai rakan|或加入好友|அல்லது நண்பருடன் சேர்
Room code|Kod bilik|房间代码|அறைக் குறியீடு
Join room|Sertai bilik|加入房间|அறையில் சேர்
Kitchen lobby|Lobi dapur|厨房大厅|சமையலறைக் கூடம்
PRIVATE ROOM|BILIK PERIBADI|私人房间|தனி அறை
Chef crew|Pasukan cef|厨师队伍|சமையலர் குழு
Waiting for a chef|Menunggu cef|等待厨师加入|சமையலருக்காகக் காத்திருக்கிறது
Choose an apron|Pilih apron|选择围裙|மேலங்கியைத் தேர்ந்தெடு
Invite friends|Jemput rakan|邀请好友|நண்பர்களை அழை
Share this code with your crew.|Kongsi kod ini dengan pasukan anda.|将代码分享给队友。|இந்தக் குறியீட்டைக் குழுவுடன் பகிருங்கள்.
Copy code|Salin kod|复制代码|குறியீட்டை நகலெடு
Copy invite link|Salin pautan jemputan|复制邀请链接|அழைப்பு இணைப்பை நகலெடு
Difficulty|Kesukaran|难度|கடின நிலை
Easy|Mudah|简单|எளிது
Normal|Sederhana|普通|இயல்பு
Hard|Sukar|困难|கடினம்
Ready|Sedia|已准备|தயார்
Not ready|Belum sedia|未准备|தயாரில்லை
I’m ready|Saya sedia|我准备好了|நான் தயார்
Mark not ready|Tandakan belum sedia|取消准备|தயார்நிலையை நீக்கு
Start game|Mula permainan|开始游戏|விளையாட்டைத் தொடங்கு
Before service|Sebelum servis|开餐前|சேவைக்கு முன்
PRE-GAME GUIDE|PANDUAN PERMAINAN|赛前指南|விளையாட்டு வழிகாட்டி
UNTIMED PRACTICE|LATIHAN TANPA HAD MASA|不限时练习|நேர வரம்பில்லாப் பயிற்சி
Practice recipe|Resipi latihan|练习食谱|பயிற்சி செய்முறை
Ready to cook|Sedia untuk memasak|准备烹饪|சமைக்கத் தயார்
Customer orders|Pesanan pelanggan|顾客订单|வாடிக்கையாளர் ஆர்டர்கள்
Training order|Pesanan latihan|练习订单|பயிற்சி ஆர்டர்
Untimed practice|Latihan tanpa had masa|不限时练习|நேர வரம்பில்லாப் பயிற்சி
Round left|Baki masa|回合剩余|மீதமுள்ள நேரம்
TIME LEFT|BAKI MASA|剩余时间|மீதமுள்ள நேரம்
Score|Markah|得分|மதிப்பெண்
Total score|Jumlah markah|总分|மொத்த மதிப்பெண்
Orders served|pesanan disaji|份订单已上菜|ஆர்டர்கள் பரிமாறப்பட்டன
Orders missed|pesanan terlepas|份订单未完成|ஆர்டர்கள் தவறின
Stars|bintang|星|நட்சத்திரங்கள்
Quick order|Pesanan ringkas|快捷订单|விரைவு ஆர்டர்
Clean plates|Pinggan bersih|干净餐盘|சுத்தமான தட்டுகள்
Returned|Dipulangkan|退回餐盘|திரும்பிய தட்டுகள்
Ingredients|Bahan|食材|பொருட்கள்
Kitchen|Dapur|厨房|சமையலறை
Move|Bergerak|移动|நகர்
Pick up, place, plate, or serve|Ambil, letak, hidang atau sajikan|拿取、放置、装盘或上菜|எடு, வை, தட்டில் இடு அல்லது பரிமாறு
Work at the highlighted station|Gunakan stesen yang diserlahkan|操作高亮工作台|ஒளிரும் நிலையத்தைப் பயன்படுத்து
Waiting for the next order…|Menunggu pesanan seterusnya…|等待下一份订单…|அடுத்த ஆர்டருக்குக் காத்திருக்கிறது…
Service complete!|Servis selesai!|营业结束！|சேவை முடிந்தது!
Training complete!|Latihan selesai!|练习完成！|பயிற்சி முடிந்தது!
Play again|Main semula|再玩一次|மீண்டும் விளையாடு
Served|Disaji|已上菜|பரிமாறியது
Expired|Tamat masa|已超时|காலாவதியானது
Best streak|Rentetan terbaik|最佳连击|சிறந்த தொடர்
Coconut rice|Nasi santan|椰浆饭|தேங்காய்ப் பால் சாதம்
Sambal|Sambal|参巴酱|சம்பல்
Chopped cucumber|Timun dipotong|切好的黄瓜|நறுக்கிய வெள்ளரிக்காய்
Chopped pineapple|Nanas dipotong|切好的菠萝|நறுக்கிய அன்னாசி
Chopped chicken|Ayam dipotong|切好的鸡肉|நறுக்கிய கோழி
Fried ikan bilis|Ikan bilis goreng|炸小鱼干|வறுத்த நெத்திலி
Rojak sauce|Sos rojak|罗惹酱|ரோஜாக் சாஸ்
Flat rice noodles|Kuetiau|河粉|தட்டையான அரிசி நூடுல்ஸ்
Prawns|Udang|虾|இறால்
Curry broth|Kuah kari|咖喱汤底|கறி குழம்பு
Bean sprouts|Taugeh|豆芽|முளைகட்டிய பயறு
Peanut sauce|Kuah kacang|花生酱|கடலைச் சாஸ்
Ice|Ais|冰块|பனிக்கட்டி
Red beans|Kacang merah|红豆|சிவப்பு பீன்ஸ்
Rose syrup|Sirap ros|玫瑰糖浆|ரோஜா பாகு
Cook at the stove|Masak di dapur|在炉灶上烹煮|அடுப்பில் சமை
Toss in the mixing bowl|Gaul dalam mangkuk|在拌碗中拌匀|கலவைப் பாத்திரத்தில் கிளறு
Shave and top at the ice station|Kisar ais dan tambah bahan di stesen ais|在刨冰台刨冰并加配料|பனிக்கட்டி நிலையத்தில் துருவிப் பொருட்களைச் சேர்
Stir-fry at the stove|Goreng di dapur|在炉灶上翻炒|அடுப்பில் வதக்கு
Cook on the grill|Bakar di pemanggang|在烤架上烤制|கிரில்லில் சமை
Simmer at the stove|Reneh di dapur|在炉灶上炖煮|அடுப்பில் மெல்லக் கொதிக்க விடு
Malay|Melayu|马来|மலாய்
Chinese|Cina|华人|சீன
Indian|India|印度|இந்திய
Training|Latihan|练习|பயிற்சி
Rice & dessert|Nasi dan pencuci mulut|米饭和甜品|சாதமும் இனிப்பும்
Hot favourites|Hidangan panas|热门热菜|பிரியமான சூடான உணவுகள்
Full hawker menu|Menu penjaja penuh|完整小贩菜单|முழு தெருவுணவு மெனு
Chop marked ingredients at a cutting board. Fry ikan bilis at the fryer when it’s on the recipe.|Potong bahan bertanda di papan pemotong. Goreng ikan bilis jika diperlukan.|在砧板上切好标注的食材。食谱需要时，用炸锅炸小鱼干。|குறிக்கப்பட்ட பொருட்களை வெட்டுப் பலகையில் நறுக்குங்கள். தேவைப்பட்டால் நெத்திலியைப் பொரியுங்கள்.
Collect hot food before the burn countdown reaches zero. Use clean dishware to plate and deliver at Serve.|Angkat makanan panas sebelum hangus. Gunakan pinggan bersih dan hantar ke kaunter sajian.|在烧焦倒计时结束前取出热菜。用干净餐盘装盘并送到出餐台。|கருகும் நேரம் முடியும் முன் சூடான உணவை எடுங்கள். சுத்தமான தட்டில் வைத்து பரிமாறும் இடத்தில் கொடுங்கள்.
Work at a station|Gunakan stesen|操作工作台|நிலையத்தைப் பயன்படுத்து
Drop or pick up a floor item|Letak atau ambil barang di lantai|放下或捡起地上的物品|தரையில் வை அல்லது தரையிலிருந்து எடு
There’s already an item here. Move to a clear tile.|Sudah ada barang di sini. Pindah ke petak kosong.|这里已有物品。请移到空格。|இங்கே ஏற்கெனவே ஒரு பொருள் உள்ளது. காலியான கட்டத்திற்குச் செல்லுங்கள்.
Stand on a dropped item and press E to pick it up.|Berdiri di atas barang dan tekan E untuk mengambilnya.|站到物品所在格，按 E 捡起。|கீழே வைத்த பொருளின் மீது நின்று E அழுத்தி எடுங்கள்.
Pick up, drop, serve|Ambil, letak, sajikan|拿取、放下、上菜|எடு, வை, பரிமாறு
E · Pick up floor item|E · Ambil barang di lantai|E · 捡起地上的物品|E · தரையிலிருந்து பொருளை எடு
E · Drop held item|E · Letak barang di lantai|E · 放下手中的物品|E · கையிலுள்ள பொருளைத் தரையில் வை
Pick up, place, serve|Ambil, letak, sajikan|拿取、放置、上菜|எடு, வை, பரிமாறு
Arrow keys|Kekunci anak panah|方向键|அம்புக்குறி விசைகள்
The timer starts when you’re ready.|Masa bermula apabila anda sedia.|准备好后开始计时。|நீங்கள் தயாரானதும் நேரம் தொடங்கும்.
Follow the recipe and serve one dish to complete the lesson.|Ikut resipi dan sajikan satu hidangan untuk melengkapkan latihan.|按食谱完成并上菜即可结束练习。|பயிற்சியை முடிக்கச் செய்முறையைப் பின்பற்றி ஒரு உணவைப் பரிமாறுங்கள்.
Collect the listed ingredients. Chop marked ingredients at a board and fry ikan bilis when listed.|Ambil bahan yang disenaraikan. Potong bahan bertanda dan goreng ikan bilis jika diperlukan.|领取所列食材。切好标注的食材，需要时炸小鱼干。|பட்டியலில் உள்ள பொருட்களை எடுங்கள். குறிக்கப்பட்டவற்றை நறுக்கி, தேவைப்பட்டால் நெத்திலியைப் பொரியுங்கள்.
Use a clean plate to collect the finished dish before it burns, then bring it to Serve.|Gunakan pinggan bersih untuk mengangkat makanan sebelum hangus dan bawa ke kaunter sajian.|烧焦前用干净餐盘装盘，然后送到出餐台。|உணவு கருகும் முன் சுத்தமான தட்டில் எடுத்து, பரிமாறும் இடத்தில் கொடுங்கள்.
Sambal is provided at the stove.|Sambal disediakan di dapur.|炉灶已备好参巴酱。|அடுப்பில் சம்பல் தயாராக உள்ளது.
Rose syrup is provided at the ice station.|Sirap ros disediakan di stesen ais.|刨冰台已备好玫瑰糖浆。|பனிக்கட்டி நிலையத்தில் ரோஜா பாகு தயாராக உள்ளது.
Walk up to a station to interact.|Dekati stesen untuk menggunakannya.|靠近工作台进行操作。|பயன்படுத்த நிலையத்தை அணுகுங்கள்.
Connection lost. Reconnecting…|Sambungan terputus. Menyambung semula…|连接中断。正在重连…|இணைப்பு துண்டிக்கப்பட்டது. மீண்டும் இணைகிறது…
E · Serve a plated order|E · Sajikan hidangan|E · 上菜|E · தட்டிலுள்ள உணவைப் பரிமாறு
E · Take or return a clean plate|E · Ambil atau pulangkan pinggan bersih|E · 拿取或归还干净餐盘|E · சுத்தமான தட்டை எடு அல்லது திருப்பிக் கொடு
E · Add the ingredients listed on the ticket|E · Masukkan bahan pada tiket|E · 加入订单上的食材|E · ஆர்டரில் உள்ள பொருட்களைச் சேர்
E · Pick up the dish with clean dishware|E · Ambil hidangan dengan pinggan bersih|E · 用干净餐盘装盘|E · சுத்தமான தட்டில் உணவை எடு
E · Pick up|E · Ambil|E · 拿取|E · எடு
Burns in|Hangus dalam|烧焦倒计时|கருகும் நேரம்
BURN|HANGUS|烧焦|கருகும்
BURNED|HANGUS|已烧焦|கருகியது
READY|SEDIA|已完成|தயார்
CHOP|POTONG|切菜|நறுக்கு
STOVE|DAPUR|炉灶|அடுப்பு
GRILL|PEMANGGANG|烤架|கிரில்
MIX|GAUL|拌料|கிளறு
ICE STATION|STESEN AIS|刨冰台|பனிக்கட்டி நிலையம்
WASH|BASUH|清洗|கழுவு
SERVE|SAJI|出餐|பரிமாறு
PLATES|PINGGAN|餐盘|தட்டுகள்
CUPS|CAWAN|杯子|கோப்பைகள்
CUP RETURN|CAWAN KOTOR|杯子回收|கோப்பைத் திருப்புக
TABLE|MEJA|备餐台|மேசை
Clean cups|Cawan bersih|干净杯子|சுத்தமான கோப்பைகள்
Cup returns|Cawan kotor|已退回的杯子|திரும்பிய கோப்பைகள்
Serve in a cup|Hidang dalam cawan|用杯子盛装|கோப்பையில் பரிமாறு
E · Fill a clean cup|E · Isi cawan bersih|E · 用干净杯子盛装|E · சுத்தமான கோப்பையை நிரப்பு
E · Use a clean plate|E · Guna pinggan bersih|E · 用干净餐盘装盘|E · சுத்தமான தட்டைப் பயன்படுத்து
RETURN|PULANG|回收|திருப்புக
BIN|TONG|垃圾桶|குப்பைத்தொட்டி
FRYER|PENGGORENG|炸锅|பொரிப்பான்
Room host|Hos bilik|房主|அறை நடத்துபவர்
Reconnecting|Menyambung semula|正在重连|மீண்டும் இணைகிறது
Copied!|Disalin!|已复制！|நகலெடுக்கப்பட்டது!
Ready to start.|Sedia untuk bermula.|可以开始了。|தொடங்கத் தயார்.
Waiting for the host to start.|Menunggu hos memulakan permainan.|等待房主开始。|அறை நடத்துபவர் தொடங்கக் காத்திருக்கிறது.
Waiting for the host to start a rematch.|Menunggu hos memulakan perlawanan semula.|等待房主开始新一局。|அறை நடத்துபவர் மறுபோட்டியைத் தொடங்கக் காத்திருக்கிறது.
Leave the match and return to the main page?|Tinggalkan permainan dan kembali ke laman utama?|离开比赛并返回主页吗？|போட்டியிலிருந்து வெளியேறி முகப்புக்குத் திரும்பவா?
Room code not found.|Kod bilik tidak ditemui.|找不到房间代码。|அறைக் குறியீடு கிடைக்கவில்லை.
This kitchen is full.|Dapur ini penuh.|此房间已满。|இந்தச் சமையலறை நிரம்பியுள்ளது.
Enter a chef nickname.|Masukkan nama panggilan cef.|请输入厨师昵称。|சமையலர் புனைப்பெயரை உள்ளிடுங்கள்.
Too many attempts. Try again later.|Terlalu banyak percubaan. Cuba lagi nanti.|尝试次数过多，请稍后重试。|அதிக முயற்சிகள். பிறகு மீண்டும் முயலுங்கள்.
Use 3–24 letters, numbers, underscores or hyphens and a password of 8–128 characters.|Gunakan 3–24 huruf, nombor, garis bawah atau sempang dan kata laluan 8–128 aksara.|用户名须为 3–24 位字母、数字、下划线或连字符，密码须为 8–128 个字符。|3–24 ஆங்கில எழுத்துகள், எண்கள், அடிக்கோடுகள் அல்லது இணைப்புக்கோடுகளையும் 8–128 எழுத்துக் கடவுச்சொல்லையும் பயன்படுத்துங்கள்.
Check your profile details.|Semak butiran profil anda.|请检查个人资料。|உங்கள் சுயவிவர விவரங்களைச் சரிபாருங்கள்.
`.trim().split('\n').map(line => line.split('|'))
const dictionary = new Map(entries.map(([key, ms, zh, ta]) => [key, { ms, zh, ta }]))
export function t(text: string) {
  return language === 'en' ? text : dictionary.get(text)?.[language] ?? text
}
