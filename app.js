/* PRICE and WEIGHT live in index.html (#pdata): the payment worker re-prices carts by reading them from there. Edit them there only. */
const _pd=document.getElementById("pdata").textContent;
const PRICE=JSON.parse(_pd.match(/const PRICE=(\{.*?\});/)[1]);
const WEIGHT=Object.fromEntries([..._pd.match(/const WEIGHT=\{([\s\S]*?)\};/)[1].matchAll(/(\w+):([\d.]+)/g)].map(x=>[x[1],+x[2]]));
const IMG={"hdtissue": {"thumb": "thumbs/hdtissue.jpg"}, "hdbuddy": {"thumb": "thumbs/hdbuddy.jpg"}, "hdtray": {"thumb": "thumbs/hdtray.jpg"}, "hdtool": {"thumb": "thumbs/hdtool.jpg"}, "hdclock": {"thumb": "thumbs/hdclock.jpg"}, "wilson": {"thumb": "thumbs/wilson.jpg"}, "snoopy": {"thumb": "thumbs/snoopy.jpg"}, "pcorn": {"thumb": "thumbs/pcorn.jpg"}, "gmug": {"thumb": "thumbs/gmug.jpg"}, "drip": {"thumb": "thumbs/drip.jpg"}, "knobs": {"thumb": "thumbs/knobs.jpg"}, "xkit": {"thumb": "thumbs/xkit.jpg"}, "ttt": {"thumb": "thumbs/ttt.jpg"}, "fncs": {"thumb": "thumbs/fncs.jpg"}, "fish": {"thumb": "thumbs/fish.jpg"}, "disney": {"thumb": "thumbs/disney.jpg"}, "crown": {"thumb": "thumbs/crown.jpg"}, "ltr": {"thumb": "thumbs/ltr.jpg"}, "d2": {"thumb": "thumbs/d2.jpg"}, "d5": {"thumb": "thumbs/d5.jpg"}, "d6": {"thumb": "thumbs/d6.jpg"}, "hood": {"thumb": "thumbs/hood.jpg"}, "skel": {"thumb": "thumbs/skel.jpg"}, "lamp": {"thumb": "thumbs/lamp.jpg"}, "lampman": {"thumb": "thumbs/lampman.jpg"}, "pmaskl": {"thumb": "thumbs/pmaskl.jpg"}, "pmaskm": {"thumb": "thumbs/pmaskm.jpg"}, "pmasks": {"thumb": "thumbs/pmasks.jpg"}, "cubea": {"thumb": "thumbs/cubea.jpg"}, "cubeb": {"thumb": "thumbs/cubeb.jpg"}, "ks1": {"thumb": "thumbs/ks1.jpg"}, "ks2": {"thumb": "thumbs/ks2.jpg"}, "ks3": {"thumb": "thumbs/ks3.jpg"}, "kcm": {"thumb": "thumbs/kcm.jpg"}, "chips": {"thumb": "thumbs/chips.jpg"}, "pringles": {"thumb": "thumbs/pringles.jpg"}, "clips": {"thumb": "thumbs/clips.jpg"}, "monk": {"thumb": "thumbs/monk.jpg"}, "ghost": {"thumb": "thumbs/ghost.jpg"}, "abst": {"thumb": "thumbs/abst.jpg"}, "w1": {"thumb": "thumbs/w1.jpg"}, "w2": {"thumb": "thumbs/w2.jpg"}, "w4": {"thumb": "thumbs/w4.jpg"}, "w5": {"thumb": "thumbs/w5.jpg"}, "vase": {"thumb": "thumbs/vase.jpg"}, "vase2": {"thumb": "thumbs/vase2.jpg"}, "vase3": {"thumb": "thumbs/vase3.jpg"}};
const COLORS=[["اللون الأساسي",null],["أبيض","#f3f1ec"],["أسود","#242424"],["رمادي","#8f969a"],["أحمر","#cc2f2f"],["برتقالي","#ee7a1f"],["أصفر","#f2c22c"],["أخضر","#2f9a57"],["أزرق","#2a5cc8"],["بنفسجي","#7a4cc2"],["وردي","#ee6f9e"],["ذهبي","#c79a32"],["بني","#6e4a2e"]];
const OUT=new Set([9]); /* colours not in stock right now (9 = purple) */
const DUCK="تعليقة سيارة أو ديكور طبلون", KS="ميدالية مفاتيح وستاند جوال", XB="إكسسوار مكينة xBloom";
/* PRICES:START — generated from the invoicing-app formula (print file weight + time, shared settings). [single, wholesale(=set)] */
const OLD={};
/* PRICES:END */
const ITEMS=[
 {id:"d2",cat:"إكسسوارات السيارة",name:"البطة الرايقة",use:DUCK},
 {id:"d5",cat:"إكسسوارات السيارة",name:"البطة الكيوت",use:DUCK},
 {id:"d6",cat:"إكسسوارات السيارة",name:"بطة اليوغا",use:DUCK},
 {id:"skel",cat:"ميداليات",name:"هيكل عظمي",use:"ميدالية أو ديكور مكتب"},
 {id:"ks1",cat:"ميداليات",name:"ميدالية وستاند جوال، ثلاثي",use:KS},
 {id:"ks2",cat:"ميداليات",name:"ميدالية وستاند جوال، مدمج",use:KS},
 {id:"ks3",cat:"ميداليات",name:"ميدالية وستاند جوال، إطار",use:KS},
 {id:"hood",cat:"ميداليات",name:"بطة بالهودي",use:"ميدالية أو تعليقة شنطة"},
 {id:"kcm",cat:"ميداليات",name:"ميدالية مكينة القهوة",use:"ميدالية مفاتيح"},
 {id:"drip",cat:"إكسسوارات القهوة",name:"أومني دريبر 2 (نيقوشيتر) xBloom Studio",use:XB},
 {id:"knobs",cat:"إكسسوارات القهوة",name:"طقم 3 مقابض ريترو xBloom Studio",use:XB},
 {id:"xkit",cat:"إكسسوارات القهوة",name:"طقم حامل وكوب جانبي مع غطاء xBloom",use:XB},
 {id:"chips",cat:"سناك وضيافة",name:"حامل علبة الشيبس",use:"حامل مع صينية، والعبارة حسب طلبك"},
 {id:"pringles",cat:"سناك وضيافة",name:"حامل البرينجلز مع صينية",use:"حامل مع صينية، بشعار البرينجلز"},
 {id:"clips",cat:"سناك وضيافة",name:"صحون الشيبس",use:"صحن صغير للشيبس"},
 {id:"monk",cat:"إكسسوارات المكتب",name:"الحكماء الثلاثة",use:"ديكور مكتب أو رف"},
 {id:"abst",cat:"إكسسوارات المكتب",name:"الحكماء الثلاثة، تجريدي",use:"ديكور مكتب أو رف"},
 {id:"ghost",cat:"إكسسوارات المكتب",name:"الحكماء الثلاثة، بالأقنعة",use:"ديكور مكتب أو رف"},
 {id:"vase",cat:"الديكور",name:"مزهرية حلزونية",use:"مزهرية ديكور للورد الصناعي أو المجفف"},
 {id:"vase2",cat:"الديكور",name:"مزهرية الموجة",use:"مزهرية طويلة للورد الصناعي أو المجفف"},
 {id:"vase3",cat:"الديكور",name:"مزهرية الأضلاع",use:"مزهرية صغيرة لوردة أو ورد مجفف"},
 {id:"lamp",cat:"الإضاءات",name:"مصباح اللولب",use:"مصباح طاولة بتصميم لولبي، مع إضاءة LED"},
 {id:"lampman",cat:"الإضاءات",name:"مصباح الرجل الصغير",use:"مصباح طاولة على شكل رجل جالس بغطاء أسود، مع إضاءة LED"},
 {id:"cubea",cat:"الإضاءات",name:"مصباح المكعبات",use:"مصباح طاولة من مكعبات معلّقة، مع إضاءة LED",vg:"cube",vl:"تصميم A",vs:"مكعب · 135 مم"},
 {id:"cubeb",cat:"الإضاءات",name:"مصباح المكعبات",use:"مصباح طاولة من مكعبات معلّقة، مع إضاءة LED",vg:"cube",vl:"تصميم B",vs:"برج · 216 مم",hid:true},
 {id:"pmaskl",cat:"الديكور",name:"قناع اليقطين",use:"قناع يقطين مرعب للهالوين، للارتداء أو التعليق",vg:"pmask",vt:"المقاس",vl:"مقاس L",vs:"210 مم"},
 {id:"pmaskm",cat:"الديكور",name:"قناع اليقطين",use:"قناع يقطين مرعب للهالوين، للارتداء أو التعليق",vg:"pmask",vt:"المقاس",vl:"مقاس M",vs:"183 مم",hid:true},
 {id:"pmasks",cat:"الديكور",name:"قناع اليقطين",use:"قناع يقطين مرعب للهالوين، للارتداء أو التعليق",vg:"pmask",vt:"المقاس",vl:"مقاس S",vs:"157 مم",hid:true},
 {id:"ttt",cat:"ألعاب وصفارات",name:"لعبة إكس أو",use:"لعبة إكس أو بحجم الجيب، تركيبها بدون غراء"},
 {id:"w1",cat:"ألعاب وصفارات",name:"صفارة البط",use:"صفارة بصوت البط"},
 {id:"w2",cat:"ألعاب وصفارات",name:"صفارة العصفور",use:"صفارة بصوت العصفور"},
 {id:"w4",cat:"ألعاب وصفارات",name:"صفارة الجبن",use:"صفارة"},
 {id:"w5",cat:"ألعاب وصفارات",name:"صفارة الجمجمة",use:"صفارة بصوت قوي"},
 {id:"fncs",cat:"إكسسوارات ألعاب الفيديو",name:"كأس بطولة FNCS",use:"كأس مجسّم بشعار FNCS على قاعدة"},
 {id:"fish",cat:"إكسسوارات ألعاب الفيديو",name:"كأس السمكة الأسطورية",use:"كأس سمكة ذهبية على قاعدة، قطعتان تركّبهما"},
 {id:"crown",cat:"إكسسوارات ألعاب الفيديو",name:"تاج الانتصار",use:"تاج الانتصار، ديكور أو هدية"},
 {id:"disney",cat:"الديكور",name:"لوحة ميكي وميني الجدارية",use:"لوحة جدارية بنقش ستنسل، تُثبت بلاصق"},
 {id:"snoopy",cat:"الديكور",name:"لوحة سنوبي تشيل",use:"لوحة جدارية بأربعة ألوان، كلمة CHILL بلونك، للغرفة أو المكتب"},
 {id:"wilson",cat:"سناك وضيافة",name:"كوب ويلسون تيكي",use:"كوب تيكي بوجه ويلسون، يتسع لكوب بلاستيك 9 أونس يوضع بداخله، للديكور والضيافة"},
 {id:"hdclock",cat:"الديكور",name:"ساعة هارلي ديفيدسون الجدارية",use:"ساعة جدارية بشعار هارلي ديفيدسون ثلاثي الأبعاد، عرضها 25 سم ومعها ميكانيزم الساعة، لغرف المحبين والمرآب"},
 {id:"hdtool",cat:"إكسسوارات المكتب",name:"صندوق عدة هارلي (حامل أقلام)",use:"صندوق عدة مصغّر بشعار هارلي: غطاء متحرك وأدراج ديكور ومنظّم علوي بـ 15 فتحة دائرية، لحفظ الأقلام والأدوات الصغيرة"},
 {id:"hdtray",cat:"إكسسوارات المكتب",name:"صينية هارلي لحفظ الأغراض",use:"صينية بتصميم هارلي مجنّح، لحفظ المفاتيح والمحفظة والعملات والسماعات"},
 {id:"hdbuddy",cat:"ألعاب وصفارات",name:"مجسم هارلي المتحرك",use:"شعار هارلي بأرجل متحركة، يُطبع جاهزًا بدون تركيب، هدية ظريفة للمكتب أو السيارة"},
 {id:"hdtissue",cat:"سناك وضيافة",name:"غطاء مناديل هارلي",use:"غطاء علبة مناديل بشعار هارلي وخطوط برتقالية على الجانبين، للديكور والضيافة"},
 {id:"pcorn",cat:"إكسسوارات المكتب",name:"كوب أقلام أفنجرز",use:"كوب أقلام بشعار أفنجرز، يرتّب مكتبك وهدية لمحبي مارفل"},
 {id:"gmug",cat:"الديكور",name:"كوب الجمجمة الصارخة",use:"كوب بوجه جمجمة وزخارف، للديكور أو حفظ الأقلام"},
 {id:"ltr",cat:"الديكور",name:"حرف باسمك",use:"حرف مع اسمك وقلوب وزهرة، والاسم حسب طلبك"}
];
/* piece weight in grams (from Bambu Studio). Fill as: d1:24 */
/* original size in mm [X width, Y depth, Z height]. Fill as: d1:[60,55,80] */
const DIM={
 drip:[73,74,54],
 knobs:[20,20,13],
 xkit:[166,209,13],
 ks3:[39,66,12],
 ks2:[81,62,31],
 crown:[56,51,34],
 fish:[117,145,175],
 fncs:[94,62,153],
 ttt:[69,81,15],
 kcm:[22,53,25],
 hood:[71,66,128],
 disney:[207,173,3],
 chips:[81,222,81],
 clips:[61,79,57],
 pringles:[82,227,82],
 monk:[157,73,84],
 ghost:[139,76,73],abst:[184,69,100],ks1:[46,100,20],w1:[37,37,80],w2:[86,45,61],w4:[45,35,21],w5:[63,43,51],
 vase:[150,150,150],
 vase2:[143,146,180],
 vase3:[48,48,119],
 ltr:[163,21,177],
 d2:[19,39,36],d5:[25,25,30],d6:[28,69,75],skel:[129,116,16],pmaskl:[210,140,225],pmaskm:[183,122,196],pmasks:[157,105,169],lamp:[94,94,245],lampman:[139,163,233],cubea:[122,122,135],cubeb:[122,122,216],gmug:[92,114,119],pcorn:[95,93,100],snoopy:[162,136,10],wilson:[140,142,139],hdclock:[249,245,14],hdtool:[150,71,80],hdtray:[240,150,30],hdbuddy:[69,46,49],hdtissue:[247,138,83]
};
const MAXD=255;
/* وصف تسويقي لكل قطعة (يظهر في صفحة القطعة وفي وصف محركات البحث). المتغيرات المخفية (vg) ترث وصف أول قطعة من مجموعتها. أضف وصفاً هنا مع كل قطعة جديدة. */
const DESC={"hdclock": "ساعة جدارية بشعار هارلي ديفيدسون ثلاثي الأبعاد مع ميكانيزم الساعة، ديكور مميز لمحبي الدراجات والمرآب.","hdtool": "صندوق عدة مصغّر بشعار هارلي بغطاء متحرك وأدراج ديكور ومنظّم علوي، يرتّب أقلامك وأدواتك الصغيرة.","hdtray": "صينية بتصميم هارلي مجنّح وعبارة Life Behind Bars، تلم مفاتيحك ومحفظتك وسماعاتك على المكتب أو الكوميدينو.","hdbuddy": "شعار هارلي بأرجل متحركة، يُطبع جاهزًا بمفاصله بدون تركيب. هدية ظريفة للمكتب أو للسيارة.","hdtissue": "غطاء علبة مناديل بشعار هارلي وخطوط برتقالية على الجانبين، يحوّل علبتك العادية لقطعة ديكور.","d2": "بطة رايقة تعطي طبلون سيارتك شخصية ومزاج، وتبتسم لك كل ما ركبت. تختار لونها وتوصلك مطبوعة بدقة.","d5": "بطة كيوت صغيرة تضيف لمسة لطيفة لطبلون سيارتك أو مكتبك، وهدية خفيفة تفرّح من يستلمها. تختار لونها.","d6": "بطة بوضعية اليوغا، هادئة ومرحة، تهدّي مزاجك على الطبلون أو المكتب. تختار لونها.","skel": "هيكل عظمي بتصميم جريء ولافت، ميدالية أو ديكور مكتب لمحبي الطابع الغامض. تختار لونه.","ks1": "ميدالية مفاتيح وستاند للجوال في قطعة وحدة: تحملها معك وتنصب جوالك وقت ما تحتاج. بتصميم ثلاثي عملي، وتختار لونها.","ks2": "ميدالية مفاتيح وستاند للجوال بتصميم مدمج خفيف، تنصب جوالك أينما كنت وتبقى معك في مفاتيحك. تختار لونها.","ks3": "ميدالية مفاتيح وستاند للجوال بتصميم إطار أنيق، عملية للمشاهدة والمكالمات المرئية. تختار لونها.","hood": "بطة لابسة هودي، ميدالية أو تعليقة شنطة لطيفة تلفت الأنظار. تختار لونها.","kcm": "ميدالية على شكل مكينة قهوة لمحبي القهوة، وهدية خفيفة تعبّر عن ذوقهم. تختار لونها.","drip": "أومني دريبر 2 (نيقوشيتر) مخصص لجهاز xBloom Studio، إكسسوار مطبوع يكمّل ركن قهوتك المختصة.","knobs": "طقم 3 مقابض بطابع ريترو لجهاز xBloom Studio، يعطي جهازك روحًا كلاسيكية ولمسة تميّزه. تختار الألوان.","xkit": "طقم حامل وكوب جانبي مع غطاء لمكينة xBloom، يرتّب ركن القهوة ويجمع أغراضك في مكان واحد.","chips": "حامل علبة شيبس مع صينية، والعبارة عليه تكتبها أنت. ضيافة مرتبة وهدية مميزة لمحبي السناكات.","pringles": "حامل برينجلز مع صينية، يرتّب جلستك وسهرات الأفلام والألعاب. بشعار البرينجلز.","clips": "صحون صغيرة للشيبس تقسّم السناك وتخلي جلستك مرتبة ونظيفة.","monk": "قطعة ديكور رمزية من الحكماء الثلاثة، تضفي هدوء وحكمة على مكتبك أو رفك. تختار لونها.","abst": "نسخة تجريدية من الحكماء الثلاثة بخطوط حديثة، تناسب المكاتب والرفوف العصرية. تختار لونها.","ghost": "نسخة الحكماء الثلاثة بالأقنعة، بطابع غامض ولافت لمكتبك أو رفك. تختار لونها.","vase": "مزهرية حلزونية بارتفاع 15 سم تقريبًا، للورد الصناعي أو المجفف. تضيف حركة وأناقة لأي زاوية.","vase2": "مزهرية الموجة الطويلة، بارتفاع 18 سم تقريبًا، للورد الصناعي أو المجفف. تعطي رفك انسيابية.","vase3": "مزهرية الأضلاع الصغيرة، بارتفاع 12 سم تقريبًا، لوردة وحدة أو ورد مجفف. تناسب المكتب والطاولة الجانبية.","lamp": "مصباح طاولة بتصميم لولبي مع إضاءة LED، ينوّر زاويتك بدفء ويضيف لمسة ديكور. تختار لونه.","lampman": "مصباح طاولة على شكل رجل جالس بغطاء أسود مع إضاءة LED، قطعة ديكور تفتح الحديث.","cubea": "مصباح طاولة من مكعبات معلّقة بإضاءة LED تعطي المكان أجواء هادئة. متوفر بتصميمين: مكعب بارتفاع 13.5 سم أو برج بارتفاع 21.6 سم.","pmaskl": "قناع يقطين مرعب للهالوين، للارتداء أو التعليق. متوفر بثلاثة مقاسات (L وM وS) حسب استخدامك.","ttt": "لعبة إكس أو بحجم الجيب، تركيبها بدون غراء. خذها معك وتسلّى مع أصحابك في أي مكان.","w1": "صفارة بصوت البط، مرحة وتضحك كل من يسمعها. تختار لونها.","w2": "صفارة بصوت العصفور، تغريدة بسيطة بلون تختاره.","w4": "صفارة بتصميم الجبن الطريف، هدية صغيرة تضحك. تختار لونها.","w5": "صفارة جمجمة بصوت قوي، تلفت الانتباه وتناسب محبي الطابع الغامض.","fncs": "كأس مجسّم بشعار FNCS على قاعدة، لمحبي الألعاب وهواة جمع الكؤوس.","fish": "كأس السمكة الذهبية على قاعدة، قطعتان تركّبهما بنفسك. كأس يستاهل رف الانتصارات عند القيمرز.","crown": "تاج الانتصار، ديكور أو هدية لكل من يستاهل لقب البطل.","disney": "لوحة جدارية بنقش ستنسل لميكي وميني، تُثبت بلاصق بدون مسامير. تضيف مرحًا للغرفة أو المكتب.","snoopy": "لوحة سنوبي تشيل بأربعة ألوان، وكلمة CHILL بلونك المفضل. تهدّي أجواء غرفتك أو مكتبك.","wilson": "كوب تيكي بوجه ويلسون، يتسع لكوب بلاستيك 9 أونس يوضع بداخله. للديكور والضيافة.","pcorn": "كوب أقلام بشعار أفنجرز يرتّب مكتبك، وهدية رائعة لمحبي مارفل.","gmug": "كوب بوجه جمجمة وزخارف، لحفظ الأقلام أو ديكور بطابع جريء.","ltr": "حرف باسمك مع قلوب وزهرة، والاسم حسب طلبك. هدية شخصية تفرّح من تحب."};
const DESC_EN={"hdclock": "A wall clock with the 3D Harley-Davidson logo and a clock mechanism, a standout piece for riders and garages.","hdtool": "A miniature Harley toolbox with a hinged lid, decorative drawers and a top organizer for pens and small tools.","hdtray": "A winged Harley-style tray with a Life Behind Bars slogan, for keys, wallet and earbuds on a desk or nightstand.","hdbuddy": "A Harley logo buddy with movable legs, printed with working joints and no assembly. A fun gift for desk or car.","hdtissue": "A tissue box cover with the Harley logo and orange stripes on both sides, turning a plain box into decor.","d2": "A chill duck that gives your dashboard personality and a smile every time you get in. Pick its colour; printed with precision.","d5": "A small, cute duck that adds a friendly touch to your dashboard or desk, and a light gift that makes someone smile. Pick its colour.","d6": "A duck in a yoga pose, calm and playful, to settle your mood on the dashboard or desk. Pick its colour.","skel": "A skeleton with a bold, eye-catching design, a keychain or desk decor for fans of the mysterious look. Pick its colour.","ks1": "A keychain and phone stand in one piece: carry it with you and prop your phone up whenever you need. Practical triple design, in the colour you choose.","ks2": "A keychain and phone stand in a light, compact design, so you can prop your phone anywhere while it stays on your keys. Pick its colour.","ks3": "A keychain and phone stand with an elegant frame design, handy for watching videos and video calls. Pick its colour.","hood": "A duck in a hoodie, a cute keychain or bag charm that turns heads. Pick its colour.","kcm": "A coffee machine keychain for coffee lovers, and a light gift that shows their taste. Pick its colour.","drip": "The Omni Dripper 2 (Nicoshitter), made for the xBloom Studio: a printed accessory that completes your specialty coffee corner.","knobs": "A set of 3 retro-style knobs for the xBloom Studio that gives your machine a classic feel and a touch that sets it apart. Pick the colours.","xkit": "A holder and side cup set with a lid for the xBloom machine, keeping your coffee corner tidy with everything in one place.","chips": "A chips can holder with a tray, with the phrase on it written by you. Neat serving and a special gift for snack lovers.","pringles": "A Pringles can holder with a tray that keeps your movie and gaming nights tidy. With the Pringles logo.","clips": "Small chip plates that portion your snacks and keep your seating area neat and clean.","monk": "A symbolic decor piece of the Three Wise Ones, bringing calm and wisdom to your desk or shelf. Pick its colour.","abst": "An abstract take on the Three Wise Ones with modern lines, suited to contemporary desks and shelves. Pick its colour.","ghost": "The Three Wise Ones with masks, with a mysterious, eye-catching look for your desk or shelf. Pick its colour.","vase": "A spiral vase about 15 cm tall, for artificial or dried flowers. It adds movement and elegance to any corner.","vase2": "The tall Wave vase, about 18 cm, for artificial or dried flowers. It gives your shelf a flowing line.","vase3": "The small Ribbed vase, about 12 cm, for a single flower or dried stems. Suits a desk or side table.","lamp": "A table lamp with a spiral design and LED light that warms your corner and adds a decor touch. Pick its colour.","lampman": "A table lamp shaped like a seated man with a black shade and LED light, a decor piece that starts conversations.","cubea": "A table lamp of hanging cubes with LED light that gives the room a calm mood. Two designs: a cube 13.5 cm tall or a tower 21.6 cm tall.","pmaskl": "A scary pumpkin mask for Halloween, to wear or hang. Three sizes (L, M and S) to suit your use.","ttt": "A pocket-sized X-O game that assembles without glue. Take it anywhere and play with your friends.","w1": "A duck-sound whistle that makes everyone who hears it laugh. Pick its colour.","w2": "A bird-sound whistle, a simple chirp in the colour you choose.","w4": "A whistle in a funny cheese design, a small gift that raises a smile. Pick its colour.","w5": "A skull whistle with a loud sound that grabs attention and suits fans of the mysterious look.","fncs": "A sculpted trophy with the FNCS emblem on a base, for gamers and trophy collectors.","fish": "A golden fish trophy on a base, two pieces you assemble yourself. A trophy that deserves a spot on a gamer's victory shelf.","crown": "The Victory Crown, decor or a gift for anyone who deserves the champion title.","disney": "A wall art piece with a stencil Mickey and Minnie design, mounted with adhesive and no nails. Adds fun to a room or desk.","snoopy": "A Snoopy Chill wall art in four colours, with the word CHILL in your favourite colour. Calms the mood of your room or desk.","wilson": "A tiki mug with a Wilson face that holds a 9 oz plastic cup inside it. For decor and serving.","pcorn": "A pen cup with the Avengers emblem that tidies your desk, and a great gift for Marvel fans.","gmug": "A mug with a skull face and ornaments, for holding pens or as bold decor.","ltr": "A letter with your name, hearts and a flower, with the name as you request. A personal gift that delights the one you love."};
const lead=it=>it.vg?ITEMS.find(i=>i.vg===it.vg):it;
const dsc=it=>DESC[it.id]||DESC[lead(it).id]||"";
/* 3D models from the print files. file: path published next to the page. keep: names of 3MF parts that keep their own colour (beak, eyes...). Fill as: d1:{file:"models/d1.3mf",keep:["beak","eyes"]} */
const MODELS={hdtray:{file:"models/hdtray.json",grid:true,keep:["keep"],def:1},hdbuddy:{file:"models/hdbuddy.json",grid:true,def:1},hdtissue:{file:"models/hdtissue.json",grid:true,keep:["keep"],def:2,az:-0.4},hdclock:{file:"models/hdclock.json",grid:true,keep:["keep"],def:2,up:1},hdtool:{file:"models/hdtool.json",grid:true,keep:["keep"],def:2,az:-0.4},wilson:{file:"models/wilson.json",grid:true,keep:["keep"],def:1,az:-0.6},pmaskl:{file:"models/pmaskl.json",grid:true,def:5,az:-0.6},pmaskm:{file:"models/pmaskm.json",grid:true,def:5,az:-0.6},pmasks:{file:"models/pmasks.json",grid:true,def:5,az:-0.6},lampman:{file:"models/lampman.json",grid:true,keep:["keep"],def:1,az:-1.35,two:1},cubea:{file:"models/cubea.json",grid:true,def:2},cubeb:{file:"models/cubeb.json",grid:true,def:2},lamp:{file:"models/lamp.json",grid:true,def:1},snoopy:{file:"models/snoopy.json",grid:true,keep:["keep"],def:2,up:1},pcorn:{file:"models/pcorn.json",grid:true,def:1},gmug:{file:"models/gmug.json",grid:true,def:1},drip:{file:"models/drip.json",grid:true,def:2},knobs:{file:"models/knobs.json",grid:true,def:1},xkit:{file:"models/xkit.json",grid:true,def:1},d2:{file:"models/d2.json",grid:true,def:1},d5:{file:"models/d5.json",grid:true,keep:["keep"],def:1},d6:{file:"models/d6.json",grid:true,def:1},skel:{file:"models/skel.json",grid:true,def:1,up:true},ltr:{file:"models/ltr.json",grid:true,keep:["keep"],def:10},vase:{file:"models/vase.json",grid:true},vase2:{file:"models/vase2.json",grid:true},vase3:{file:"models/vase3.json",grid:true},w5:{file:"models/w5.json",grid:true,def:3},w4:{file:"models/w4.json",grid:true,def:6},w2:{file:"models/w2.json",grid:true,def:6},w1:{file:"models/w1.json",grid:true,keep:["keep"],def:2},ks1:{file:"models/ks1.json",grid:true,def:2},ks2:{file:"models/ks2.json",grid:true},ks3:{file:"models/ks3.json",grid:true,up:true},chips:{file:"models/chips.json",grid:true,keep:["keep"],def:2,rotZ:Math.PI*0.85},clips:{file:"models/clips.json",grid:true,def:4},crown:{file:"models/crown.json",grid:true,def:1},disney:{file:"models/disney.json",grid:true,def:2},fish:{file:"models/fish.json",grid:true,def:11},fncs:{file:"models/fncs.json",grid:true,def:11},kcm:{file:"models/kcm.json",grid:true,def:2},hood:{file:"models/hood.json",grid:true,keep:["keep"],def:10},ttt:{file:"models/ttt.json",grid:true,keep:["keep"],def:6},pringles:{file:"models/pringles.json",grid:true,keep:["keep"],def:4,rotZ:Math.PI*0.85},monk:{file:"models/monk.json",grid:true,def:12},abst:{file:"models/abst.json",grid:true,def:2},ghost:{file:"models/ghost.json",grid:true,keep:["keep"],def:2}};
ITEMS.forEach(i=>{if(WEIGHT[i.id])i.g=WEIGHT[i.id];if(DIM[i.id])i.d=DIM[i.id]});
const CAT_ORDER=["إكسسوارات السيارة","إكسسوارات القهوة","إكسسوارات المكتب","الديكور","الإضاءات","ميداليات","سناك وضيافة","ألعاب وصفارات","إكسسوارات ألعاب الفيديو"];
const CATS=[...new Set(ITEMS.map(i=>i.cat))].sort((a,b)=>CAT_ORDER.indexOf(a)-CAT_ORDER.indexOf(b));
/* "وصل حديثاً": آخر 6 قطع أُضيفت، الأحدث أولاً. عند إضافة قطعة جديدة تُوضع في أول القائمة وتخرج الأقدم (وتبقى في قسمها). */
const NEW=["hdtissue","hdbuddy","hdtray","hdtool","hdclock","wilson"];
const FEATURED=["pmaskl","lampman","cubea","lamp","snoopy","pcorn"]; /* "الأكثر طلباً" on the home page (6 slots). STANDING RULE (Nov 7 2026): when a new piece is added it goes FIRST in NEW; the piece that falls out of NEW is added FIRST in FEATURED, and the LAST item of FEATURED is dropped (it stays in its category). */
const $=s=>document.querySelector(s);
const esc=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let cart=[], cur=null, hist=[{v:"home"}], hi=0;

/* ---------- navigation with back / forward ---------- */
function go(view){hist=hist.slice(0,hi+1);hist.push(view);hi++;render(true)}
$("#back").onclick=()=>{if(hi>0){hi--;render(true)}};
$("#fwd").onclick=()=>{if(hi<hist.length-1){hi++;render(true)}};
function setMeta(sel,val){let e=document.querySelector(sel);if(!e){e=document.createElement('meta');const k=sel.match(/\[(name|property)="([^"]+)"\]/);e.setAttribute(k[1],k[2]);document.head.appendChild(e)}e.setAttribute('content',val)}
function ldSet(o){const e=document.getElementById("ldPage");if(e)e.textContent=o?JSON.stringify(o):""}
function setCanon(u){let e=document.querySelector('link[rel="canonical"]');if(!e){e=document.createElement("link");e.rel="canonical";document.head.appendChild(e)}e.href=u}
function seoFor(id){   // روابط القطع تنشر بصورتها واسمها في واتساب وانستقرام، وبيانات منظمة لمحركات البحث
  const HOMEKW='طباعة ثلاثية الأبعاد, طباعة 3D السعودية, متجر طباعة 3D, هدايا مطبوعة, هدايا مميزة, ديكور مكتب, ديكور منزل, مزهريات, ميداليات, ميدالية مفاتيح, صفارات, إكسسوارات القهوة, إكسسوارات xBloom, كأس مخصص, هدايا تخرج, طباعة حسب الطلب, مجسمات, RAX3D',base='https://rax3d.com/', it=id&&ITEMS.find(i=>i.id===id);
  const T0='RAX3D | طباعة ثلاثية الأبعاد في السعودية: هدايا وديكور وإكسسوارات حسب الطلب',D0='متجر طباعة 3D في السعودية: مزهريات وهدايا وميداليات وإكسسوارات قهوة xBloom وصفارات وديكور مكتب وكؤوس. اختر القطعة واللون والمقاس وشوفها ثلاثية الأبعاد قبل الطلب.';
  if(!it){document.title=LANG==="en"?"RAX3D | Order your piece":T0;setMeta('meta[name="description"]',D0);setMeta('meta[name="keywords"]',HOMEKW);setMeta('meta[property="og:title"]',T0);setMeta('meta[property="og:description"]',D0);setMeta('meta[property="og:image"]',base+'icon-512.png');setMeta('meta[property="og:url"]',base);setMeta('meta[name="twitter:title"]',T0);setMeta('meta[name="twitter:description"]',D0);setMeta('meta[name="twitter:image"]',base+'icon-512.png');setCanon(base);
   ldSet({"@context":"https://schema.org","@type":"ItemList","name":"قطع RAX3D","itemListElement":ITEMS.map((i,n)=>({"@type":"ListItem","position":n+1,"url":base+"?p="+encodeURIComponent(i.id),"name":i.name}))});return}
  const KWC={"إكسسوارات السيارة":"إكسسوارات سيارة, تعليقة سيارة","إكسسوارات القهوة":"إكسسوارات قهوة, xBloom, أدوات تحضير القهوة","إكسسوارات المكتب":"إكسسوارات مكتب, ديكور مكتب, هدايا موظفين","الديكور":"ديكور منزل, مزهرية, هدايا ديكور","الإضاءات":"مصباح طاولة, إضاءة ديكور, مصباح LED, إضاءة مكتب","ميداليات":"ميدالية مفاتيح, توزيعات, هدية صغيرة","سناك وضيافة":"ضيافة, حامل شيبس, ديكور طاولة","ألعاب وصفارات":"ألعاب, صفارة, هدايا أطفال","إكسسوارات ألعاب الفيديو":"ألعاب فيديو, فورتنايت, كأس, هدايا قيمرز"},kw=[it.name,KWC[it.cat],"طباعة ثلاثية الأبعاد السعودية","طباعة 3D","RAX3D"].filter(Boolean).join(', '),TI={"إكسسوارات السيارة":"تعليقة سيارة مطبوعة 3D","إكسسوارات القهوة":"إكسسوار قهوة مطبوع 3D","ميداليات":"ميدالية مطبوعة 3D","إكسسوارات المكتب":"ديكور مكتب مطبوع 3D","الديكور":"ديكور منزل مطبوع 3D","الإضاءات":"إضاءة ديكور مطبوعة 3D","سناك وضيافة":"ضيافة مطبوعة 3D","ألعاب وصفارات":"هدية مطبوعة 3D","إكسسوارات ألعاب الفيديو":"هدية قيمرز مطبوعة 3D"},sz=(it.d&&ITEMS.filter(i=>i.name===it.name).length>1)?' ('+Math.round(it.d[2]/10)+' سم)':'',t=it.name+sz+' – '+(TI[it.cat]||'مطبوع ثلاثي الأبعاد')+' | RAX3D', pr=PRICE[it.id], desc=(dsc(it)||((it.use||it.name)+sz+'. اطلب قطعتك بالطباعة ثلاثية الأبعاد بالألوان والمقاس اللي تبيه'))+(pr?' من '+pr[1]+' ريال.':'');
  document.title=t;setMeta('meta[name="description"]',desc);setMeta('meta[name="keywords"]',kw);
  setMeta('meta[property="og:title"]',t);
  setMeta('meta[property="og:description"]',desc);
  const img=base+(IMG[it.id]?IMG[it.id].thumb:'icon-512.png');
  setMeta('meta[property="og:image"]',img);
  setMeta('meta[property="og:url"]',itemUrl(it.id));setMeta('meta[name="twitter:title"]',t);setMeta('meta[name="twitter:description"]',desc);setMeta('meta[name="twitter:image"]',img);
  setCanon(itemUrl(it.id));
  const o={"@context":"https://schema.org","@type":"Product","name":it.name,"description":desc,"image":[base+"hq/"+it.id+"-0.webp",img],"sku":it.id,"keywords":kw,"brand":{"@type":"Brand","name":"RAX3D"},"category":it.cat};
  if(it.g)o.weight={"@type":"QuantitativeValue","value":it.g,"unitCode":"GRM"};
  if(pr)o.offers={"@type":"Offer","url":itemUrl(it.id),"priceCurrency":"SAR","price":String(pr[0]),"availability":"https://schema.org/InStock","itemCondition":"https://schema.org/NewCondition","seller":{"@type":"Organization","name":"RAX3D"}};
  ldSet(o);
}
function render(scroll){
  const v=hist[hi];$("#back").disabled=hi===0;$("#fwd").disabled=hi===hist.length-1;
  closeDrawer();
  const activeCat=v.v==="cat"?v.cat:(v.v==="item"||v.v==="edit")?ITEMS.find(i=>i.id===v.id).cat:null;
  rail(activeCat);
  cur=null;V.on=false;
  if(v.v==="home")home();else if(v.v==="cat")catView(v.cat);else if(v.v==="item")itemView(v.id);else if(v.v==="edit")editView(v.id);else if(v.v==="fav")favView();else cartView();
  seoFor(v.v==="item"||v.v==="edit"?v.id:null);
  if(scroll){if(window.LENIS)LENIS.scrollTo(0,{immediate:true,force:true});else window.scrollTo(0,0)}
  if(window.motionView)motionView();
}
function openDrawer(){$("#rail").classList.add("open");$("#drawerBg").classList.add("open");$("#menuBtn").setAttribute("aria-expanded","true")}
function closeDrawer(){$("#rail").classList.remove("open");$("#drawerBg").classList.remove("open");$("#menuBtn").setAttribute("aria-expanded","false")}
document.getElementById("drawerBg").addEventListener("click",closeDrawer);
function rail(active){
  $("#rail").innerHTML=`<div class="rail-hd"><b>الأقسام</b><button type="button" id="railClose" aria-label="إغلاق">×</button></div><button type="button" data-home aria-current="${active===null&&hist[hi].v==="home"}"><span class="homeic"><svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/></svg></span>الرئيسية</button>`+`<button type="button" class="inst" data-acc>👤 ${CUST?esc(CUST.n):"سجّل واكسب نقاط"}${CUST?`<span data-ptsn>${PTS==null?"":" · ⭐ "+PTS}</span>`:""}</button>`+(CUST?`<button type="button" class="inst" data-favs>❤️ <span>مفضلتي</span> <span>(${favs().length})</span></button>`:"")+(INST.standalone?"":`<button type="button" class="inst" data-inst><img src="icon-192.png" alt="">حمّل التطبيق</button>`)+
  CATS.map(c=>`<button type="button" data-cat="${c}" aria-current="${c===active}"><img src="${IMG[ITEMS.find(i=>i.cat===c).id].thumb}" alt="">${c}</button>`).join("");
}
const card=i=>`<button type="button" class="item" data-open="${i.id}">${CUST?`<span class="fv" role="button" data-fav="${i.id}" aria-label="المفضلة">${isFav(i.id)?"♥":"♡"}</span>`:""}<img src="${IMG[i.id].thumb}" alt="${i.name}" loading="lazy"><span class="cap"><b>${i.name}</b><small>${i.use}</small>${PRICE[i.id]?`<em class="pr">${OLD[i.id]?`<s class="old">${SAR(OLD[i.id])}</s> `:""}${SAR(PRICE[i.id][0])}</em>`:""}</span></button>`;
const carousel=(ids,n=4)=>`<div class="car" data-car>${ids.slice(0,n).map(id=>ITEMS.find(i=>i.id===id)).filter(Boolean).map(card).join("")}</div>`;
/* شريط يتحرك لوحده كل 3.5 ثانية، يوقف عند اللمس أو خروجه من الشاشة أو لو الجوال مفعّل تقليل الحركة، والعميل يقدر يسحبه بإصبعه */
let carT=null;
function startCars(){clearInterval(carT);const cars=[...document.querySelectorAll("[data-car]")];if(!cars.length||matchMedia("(prefers-reduced-motion:reduce)").matches)return;
 const st=new Map(cars.map(c=>[c,{i:0,pause:false,vis:true}]));
 cars.forEach(c=>{const s=st.get(c);["touchstart","pointerdown","mouseenter","focusin"].forEach(e=>c.addEventListener(e,()=>{s.pause=true},{passive:true}));["touchend","mouseleave","focusout"].forEach(e=>c.addEventListener(e,()=>{setTimeout(()=>{s.pause=false},4000)},{passive:true}));
  if("IntersectionObserver" in window)new IntersectionObserver(en=>{s.vis=en[0].isIntersecting}).observe(c)});
 carT=setInterval(()=>{if(!document.querySelector("[data-car]")){clearInterval(carT);return}cars.forEach(c=>{const s=st.get(c);if(s.pause||!s.vis||document.hidden)return;const its=c.children;if(its.length<3)return;
  s.i=(s.i+1)%(its.length-1);const x=its[s.i];if(!x)return;x.scrollIntoView({inline:"start",block:"nearest",behavior:"smooth"})})},3500)}
function home(){
  $("#ttl").innerHTML='<span><img src="icon-192.png" alt="">RAX3D</span>';
  $("#main").innerHTML=`<section class="hero"><img class="mark" src="icon-192.png" alt="شعار RAX3D" width="76" height="76">
   <h1 class="tag">قطع مميزة بطباعة ثلاثية الأبعاد</h1>
   <p class="lead">اختر القطعة واللون والمقاس، ونطبعها لك عند الطلب.</p>
   <button type="button" class="btn gold shop" data-shop>تسوّق الآن</button>
   ${CUST?"":`<button type="button" class="reglink" data-acc>سجّل واكسب نقاط ولاء على كل طلب ⭐</button>`}</section>
   <h2 id="newHd">وصل حديثاً</h2>${carousel(NEW,6)}
   <ul class="perks out"><li><b>13</b><span>لون تختار منها</span></li><li><b>3D</b><span>شوف القطعة قبل الطلب</span></li><li><b>⭐</b><span>نقطة ولاء على كل ريال</span></li></ul>
   <h2>الأكثر طلباً</h2>${carousel(FEATURED,6)}
   <h2>كيف أطلب؟</h2><ol class="how"><li><b>اختر القطعة</b><span>واللون والمقاس والعدد، وأضفها لطلبك.</span></li><li><b>أكّد طلبك</b><span>ادفع أونلاين (مدى، Apple Pay)، أو اطلب بالدفع عند الاستلام، أو أرسل الطلب بالخاص في انستقرام أو تيك توك.</span></li><li><b>نأكد طلبك</b><span>نتواصل معك بتأكيد الطلب. التجهيز من 3 إلى 7 أيام، وطلبات الجملة مدتها حسب الطلب والعدد ونتواصل معك بالخاص لتحديدها.</span></li><li><b>نطبع ونسلّم</b><span>تتابع طلبك برقم الطلب اللي في فاتورتك.</span></li></ol>
   <section class="about"><h2>نقاط الولاء</h2><ul class="note" style="text-align:right;padding-inline-start:18px;line-height:1.8"><li>كل 1000 نقطة = خصم 10 ريال</li><li>5000 نقطة = قطعة مجانية بقيمة حتى 250 ريال</li><li>تنتهي كل نقطة بعد 12 شهراً من تاريخ كسبها</li><li>النقاط لا تُستبدل بمبالغ مالية</li></ul></section>
   <section class="about"><h2>طباعة ثلاثية الأبعاد في السعودية</h2><p class="note" style="text-align:right">RAX3D متجر سعودي للطباعة ثلاثية الأبعاد (طباعة 3D): مزهريات وديكور للمنزل والمكتب، هدايا مميزة وكؤوس، ميداليات مفاتيح، صفارات، وإكسسوارات قهوة xBloom. تختار القطعة واللون والمقاس، وتشوفها ثلاثية الأبعاد قبل الطلب، ونطبعها لك حسب الطلب. نقبل الطلبات بالقطعة وبالجملة للمحلات والتوزيعات.</p></section>
   ${INST.standalone?"":`<button type="button" class="instbtn" data-inst><img src="icon-192.png" alt="">حمّل تطبيق RAX3D على جهازك</button>`}`;
  startCars();
}
function catView(c){
  const list=ITEMS.filter(i=>i.cat===c&&!i.hid);$("#ttl").textContent=c;
  $("#main").innerHTML=`<div class="sechd"><h2>${c}</h2><small>${list.length} قطع</small></div><div class="grid">${list.map(card).join("")}</div>`;
}
function itemView(id){   /* the piece page: photo + details only. Editing happens on the customise page (editView). */
  const it=ITEMS.find(i=>i.id===id);cur=null;$("#ttl").textContent=it.name;
  $("#main").innerHTML=`<div class="pwrap"><div class="pic"><img id="pv" src="hq/${it.id}-0.webp" width="800" height="800" alt="${it.name}" decoding="async"></div>
  <div class="pinfo">
  <div class="hd"><h1>${it.name}</h1><span class="use">${it.use}</span></div>${dsc(it)?`<p class="pdesc">${dsc(it)}</p>`:""}
  <div class="price">${PRICE[it.id]?`<b>السعر: ${PRICE[it.id][0]} ريال</b>${OLD[it.id]?`<s class="old">${OLD[it.id]} ريال</s>`:""}${isFinite(WQ(it.id))?`<span>الجملة: ${PRICE[it.id][1]} ريال للحبة من ${WQ(it.id)} حبة</span>`:""}<span class="shipn">🚚 التوصيل: ${PAY.ship||DELIV_FEE} ريال · التجهيز: من 3 إلى 7 أيام${isFinite(WQ(it.id))?" · الجملة: المدة حسب الطلب والعدد ونتواصل معك بالخاص":""}</span>`:`<b>السعر بالخاص</b>`}</div>
  ${it.vg?`<div class="vsel"><span class="lbl">${it.vt||"نوع التصميم"}</span><div class="vopts">${ITEMS.filter(x=>x.vg===it.vg).map(x=>`<button type="button" data-var="${x.id}" aria-pressed="${x.id===it.id}"><b>${x.vl}</b><small>${x.vs}</small><em>${PRICE[x.id]?SAR(PRICE[x.id][0]):""}</em></button>`).join("")}</div></div>`:""}
  <p class="note">متوفرة بـ ${COLORS.length-1-OUT.size} لون، وتقدر تعدّل مقاسها حتى ${MAXD} مم.</p>
  <button type="button" class="btn gold" data-edit="${it.id}">${MODELS[it.id]?"🧊 شوفها 3D واختر اللون وأضفها للطلب":"🎨 اختر اللون والمقاس وأضفها للطلب"}</button>
  <ol class="steps3" aria-label="خطوات الإضافة للطلب"><li>افتح المعاينة</li><li>اختر اللون والمقاس</li><li>اضغط «اعتمد وأضف للطلب»</li></ol>
  ${PRICE[it.id]?`<ul class="trust"><li>🔒 دفع آمن بمدى و Apple Pay</li><li>💵 الدفع عند الاستلام متاح</li><li>🔁 استبدال مجاني خلال 3 أيام لو فيها عيب</li></ul>`:""}
  <div class="acts"><button type="button" data-fav="${it.id}" class="${CUST&&isFav(it.id)?"on":""}">${CUST&&isFav(it.id)?"♥ في المفضلة":"♡ أضف للمفضلة"}</button><button type="button" data-share="${it.id}">🔗 شارك</button><button type="button" data-copylink="${it.id}">📋 انسخ الرابط</button></div>
  <div class="dims"><div class="dims-hd"><b>المقاسات الأصلية</b><button type="button" class="help" id="helpBtn">مم ← سم؟</button></div>
   <div class="axes">${AX.map((a,i)=>`<div class="ax"><span class="k">${a[0]}</span><small>${a[1]}</small><span class="v">${it.d?it.d[i]+" مم":"—"}</span><span class="cm">${it.d?cm(it.d[i])+" سم":"يُضاف قريباً"}</span></div>`).join("")}</div>
   <div class="dims-row"><span>الوزن: ${it.g?`<span class="num">${it.g}</span> غرام`:"يُضاف قريباً"}</span><span>القسم: ${it.cat}</span></div></div>
  </div></div>`;
}
function editView(id){   /* customise page: preview (3D when available) + colour, size, quantity, other, then confirm */
  const it=ITEMS.find(i=>i.id===id);cur={it,color:0,color2:2,pc:{},pt:-2,qty:1,mc:[],mcOpen:false,other:false,note:"",sizeOn:false,dim:null};$("#ttl").textContent=it.name;
  $("#main").innerHTML=`<div class="sechd"><h2>خصّص: ${it.name}${it.vl?` (${it.vl})`:""}</h2></div>
  <div class="pwrap"><div class="pstage"><div class="pic"><img id="pv" src="hq/${it.id}-0.webp" width="800" height="800" alt="${it.name}" decoding="async">
   ${MODELS[it.id]?`<div class="v3d-stage" id="v3dStage" hidden><div class="v3d-msg" id="v3dMsg">جاري تحميل المجسم…</div><div class="v3d-hint">اسحب بإصبعك لتدوير القطعة، وقرّب بإصبعين</div></div>
   `:""}</div>
   <p class="tip3d">${MODELS[it.id]?"🧊 لفّ القطعة بإصبعك وشوفها من كل جهة، واختر اللون من تحت ويتغير عليها مباشرة.":"🎨 اختر اللون من تحت ويتغير على الصورة مباشرة."}</p></div>
  <div class="pinfo">${MODELS[it.id]?`<div class="opt" id="partsBox" hidden></div>`:""}
  <div class="opt" id="mainOpt"><span class="lbl">اللون: <span id="cname">${COLORS[0][0]}</span></span><div class="sws">${COLORS.map((c,i)=>`<button type="button" class="sw ${c[1]?"":"orig"}${OUT.has(i)?" out":""}"${OUT.has(i)?` aria-disabled="true" title="${c[0]} — غير متوفر حالياً"`:""} style="${c[1]?"background:"+c[1]:""}" aria-label="${c[0]}" aria-pressed="${i===0}" data-c="${i}"></button>`).join("")}</div></div>${MODELS[it.id]&&MODELS[it.id].two?`
  <div class="opt" hidden><span class="lbl">لون الغطاء العلوي: <span id="cname2">${COLORS[2][0]}</span></span><div class="sws">${COLORS.map((c,i)=>c[1]&&!OUT.has(i)?`<button type="button" class="sw2" style="background:${c[1]}" aria-label="${c[0]}" aria-pressed="${i===2}" data-s="${i}"></button>`:"").join("")}</div></div>`:""}
  <div class="opt mcopt"><button type="button" class="other" id="mcBtn" aria-expanded="false">🎨 ألوان مختلفة للقطع (طلب خاص) <span>+</span></button>
   <div id="mcBox" hidden><small class="pnote">اختر الألوان اللي تبيها، واكتب أي جزء بأي لون. سعر الألوان المتعددة يختلف عن السعر المعروض، ونتواصل معك بالخاص لتأكيد السعر والتفاصيل.</small>
    <div class="sws mcsws">${COLORS.map((c,i)=>c[1]&&!OUT.has(i)?`<button type="button" class="mcsw" style="background:${c[1]}" aria-label="${c[0]}" aria-pressed="false" data-mc="${i}"></button>`:"").join("")}</div>
    <small class="pnote" id="mcSelRow" hidden><span>الألوان المختارة:</span> <b id="mcNames"></b></small>
    <textarea id="mcNote" maxlength="110" rows="2" placeholder="مثال: الغطاء أسود والباقي أبيض"></textarea></div></div>
  <small class="pnote" id="partHint2">💡 تقدر تغيّر الأجزاء أو الكتابات بلون مختلف: اختر «ألوان مختلفة للقطع» تحت.</small>
  <div class="dims"><div class="dims-hd"><b>تبي مقاس مختلف؟</b><label class="lock"><input type="checkbox" id="sizeOn"> تعديل المقاس</label></div>
   <div id="sizeBox" hidden>
    <div class="axes">${AX.map((a,i)=>`<label class="ax"><span class="k">${a[0]}</span><small>${a[1]} (مم)</small><input type="number" inputmode="decimal" min="1" max="${MAXD}" step="1" id="dim${i}" data-dim="${i}" value="${it.d?it.d[i]:""}" placeholder="مم"><span class="cm" id="cm${i}">${it.d?cm(it.d[i])+" سم":""}</span></label>`).join("")}</div>
    <div class="dims-row">${it.d?`<label class="lock"><input type="checkbox" id="keepRatio" checked> حافظ على النسبة</label><button type="button" class="linkbtn" id="resetDim">رجّع المقاس الأصلي</button>`:"<span>اكتب المقاس اللي تبيه بالمليمتر</span>"}</div>
    <div class="dmsg" id="dmsg" aria-live="polite">أقصى مقاس لكل محور ${MAXD} مم.</div>
   </div></div>
  <div class="opt"><span class="lbl">العدد</span><div class="qty"><button type="button" data-q="1" aria-label="زيادة">+</button><output id="qv">1</output><button type="button" data-q="-1" aria-label="إنقاص">−</button><span class="badge" id="qb"></span></div></div>
  <div class="opt"><button type="button" class="other" id="otherBtn" aria-expanded="false">تفاصيل إضافية قبل الطباعة <span>+</span></button>
   <div id="otherBox" hidden><textarea id="note" maxlength="200" rows="3" placeholder="اكتب طلبك، مثلاً: أبيها تعليقة، أو حجم أكبر، أو اسم عليها"></textarea><div class="count"><span id="cnt">0</span>/200</div></div></div>
  <div class="confirm"><b>ملخص اختيارك</b><span id="sumLine"></span><strong id="sumPrice"></strong>
   <button type="button" class="btn gold" data-add>اعتمد وأضف للطلب</button></div></div></div>`;
  qtyUI();prep(id);sumUI();if(MODELS[it.id])setTimeout(()=>{if(cur&&cur.it.id===id&&!V.on)open3D()},60);
}
function sumUI(){const s=$("#sumLine");if(!s||!cur)return;const sz=cur.sizeOn&&dimsValid()?cur.dim.map(fmt).join(" × ")+" مم":(cur.it.d?cur.it.d.join(" × ")+" مم (الأصلي)":"المقاس الأصلي");
 s.textContent=`اللون: ${cur.mcOpen&&cur.mc.length?"ألوان متعددة ("+cur.mc.map(i=>COLORS[i][0]).join("، ")+")":ctxt()} · المقاس: ${sz} · العدد: ${cur.qty}${cur.qty>=WQ(cur.it.id)?" (جملة)":""}`;const sp=$("#sumPrice");if(sp){const u=UP(cur.it.id,cur.qty);sp.textContent=cur.mcOpen?"السعر: يتحدد بالخاص (ألوان متعددة)":u?`الإجمالي: ${u*cur.qty} ريال`+(cur.sizeOn?" (للمقاس الأصلي)":""):""}}
function accCard(){return CUST?`<div class="acc on"><div class="row"><span>الطلب باسم <b>${esc(CUST.n)}</b> · <span dir="ltr">${CUST.p}</span></span><button type="button" class="linkbtn" data-acc>تعديل</button></div><span class="pts" data-pts>${ptsTxt()}</span><span class="pts">⭐ تنضاف لك نقطة ولاء على كل ريال في هذا الطلب</span><button type="button" class="linkbtn" data-favs>❤️ مفضلتي</button></div>`
   :`<div class="acc"><b>سجّل واكسب نقاط ولاء ⭐</b><span class="inote">اسمك وجوالك بس، بدون رقم سري. كل ريال = نقطة، ويوصلنا طلبك جاهز باسمك.</span><button type="button" class="btn alt" data-acc>سجّل الحين</button></div>`}
function cartView(){
  $("#ttl").textContent="طلبي";
  $("#main").innerHTML=`<h2>طلبي</h2>${cart.length?`<div class="lines">${cart.map((o,i)=>`<div class="line"><img src="${IMG[o.id].thumb}" alt=""><div><b>${esc(String(o.name))}</b><small>${esc(String(o.color))} · ${o.qty} حبة${isW(o)?" · جملة":""}${o.size?" · مقاس "+esc(String(o.size)):""}${o.note?" · "+esc(o.note):""}</small></div>${isSP(o)?`<em class="pr">السعر بالخاص</em>`:UP(o.id,o.qty)?`<em class="pr">${SAR(LT(o))}</em>`:""}<button type="button" data-del="${i}" aria-label="حذف">×</button></div>`).join("")}</div>
  ${cart.some(PU)?`<p class="total">الإجمالي: ${TOT()} ريال${cart.some(isSP)?`<small>+ الطلب الخاص (سعره يتحدد بالخاص)</small>`:""}</p>${PAY.ship&&cart.every(o=>UP(o.id,o.qty))&&!cart.some(isSP)?`<p class="inote">${PAY.modes?`الدفع أونلاين: تختار عند الدفع بين التوصيل (+${PAY.ship} ريال) والاستلام المباشر (بدون رسوم).${codFee()?"":" الدفع عند الاستلام استلام مباشر أيضًا."}`:`الدفع أونلاين يشمل رسوم التوصيل ${PAY.ship} ريال، فيكون المطلوب ${cart.reduce((a,o)=>a+LT(o),0)+PAY.ship} ريال.${codFee()?"":" الدفع عند الاستلام استلام مباشر بدون رسوم توصيل."}`}</p>`:""}`:""}
  ${cart.length?`<p class="inote">⏱ ${cart.some(isW)?"مدة تجهيز طلب الجملة: حسب الطلب والعدد، ونتواصل معك بالخاص لتحديدها":"مدة التجهيز: من 3 إلى 7 أيام"}</p>`:""}
  ${cart.length&&!withinLimits()?`<p class="inote">الطلبات الكبيرة (أكثر من 500 حبة في السطر الواحد أو أكثر من 40 سطرًا) نرتبها معك بالخاص، استخدم «أرسل الطلب بالخاص» تحت.</p>`:""}
  ${cart.some(isSP)?`<p class="inote">🎨 فيه طلب خاص (ألوان مختلفة): سعره يختلف عن السعر المعروض. أرسل الطلب بالخاص ونتواصل معك لتأكيد السعر والتفاصيل.</p>`:""}
  ${accCard()}
  ${payable()?`<button type="button" class="btn gold" id="payBtn">ادفع الحين · مدى · Apple Pay</button>`:""}${codable()?`<button type="button" class="btn ${payable()?"alt":"gold"}" id="codBtn">اطلب والدفع عند الاستلام (استلام مباشر)</button><p class="note">بعد طلبك بالدفع عند الاستلام نتواصل معك للتنسيق على مكان الاستلام وموعده.</p>`:""}<div class="dmsec"><button type="button" class="btn ${payable()||codable()?"alt":"gold"}" id="sendBtn">أرسل الطلب بالخاص</button><p class="note sendnote">📋 لما تضغط «أرسل الطلب بالخاص» ننسخ رسالة طلبك جاهزة، ونفتح لك محادثتنا في انستقرام أو تيك توك. <b>الصقها في خانة الكتابة وأرسلها</b>، ونأكد لك طلبك وموعد التجهيز.</p></div>
  <div class="toast" id="toast" aria-live="polite"></div>`
  :accCard()+`<p class="note">ما أضفت قطع بعد.</p><button type="button" class="btn alt" data-home>تصفح القطع</button>`}`;
}
const AX=[["X","العرض"],["Y","العمق / الطول"],["Z","الارتفاع"]];
const fmt=v=>v==null?"—":(Math.round(v*10)/10).toString();
const cm=v=>(Math.round(v)/10).toFixed(1).replace(/\.0$/,"");
function setDim(i,v){
 if(cur.it.d&&$("#keepRatio")&&$("#keepRatio").checked){
  let k=v/cur.it.d[i];const mx=Math.max(...cur.it.d.map(x=>x*k));if(mx>MAXD)k*=MAXD/mx;
  cur.dim=cur.it.d.map(x=>Math.round(x*k*10)/10)
 }else cur.dim[i]=Math.round(v*10)/10}
function dimsValid(){return cur.dim&&cur.dim.every(v=>v!=null&&v>0&&v<=MAXD)}
function syncDims(skip){setTimeout(sumUI,0);
 if(!cur||!cur.dim)return;
 cur.dim.forEach((v,i)=>{const el=$("#dim"+i);if(!el)return;if(i!==skip)el.value=v==null?"":fmt(v);
  const bad=v!=null&&(v<=0||v>MAXD);el.setAttribute("aria-invalid",bad);$("#cm"+i).textContent=v?cm(v)+" سم":""});
 const over=cur.dim.some(v=>v!=null&&v>MAXD),m=$("#dmsg");
 if(over){m.className="dmsg err";m.textContent="أقصى مقاس "+MAXD+" مم لكل محور، عدّل الرقم."}
 else{m.className="dmsg";m.textContent=cur.it.d&&dimsValid()?"المقاس الجديد: "+cur.dim.map(fmt).join(" × ")+" مم":"أقصى مقاس لكل محور "+MAXD+" مم."}}
/* ---------- 3D viewer: the print file itself, so every colour is exact ---------- */
const V={};
/* lazy-load: three.js and its loaders are fetched only when a 3D view is first needed, in order */
let L3D=null;
function load3D(){if(window.THREE&&THREE.OrbitControls)return Promise.resolve();if(L3D)return L3D;
 const one=src=>new Promise((ok,no)=>{const s=document.createElement("script");s.src=src;s.async=false;s.onload=ok;s.onerror=()=>no(new Error(src));document.head.appendChild(s)});
 L3D=["lib/three.min.js","lib/fflate.min.js","lib/STLLoader.js","lib/3MFLoader.js","lib/OrbitControls.js","lib/RoomEnvironment.js"].reduce((p,src)=>p.then(()=>one(src)),Promise.resolve()).catch(e=>{L3D=null;throw e});return L3D}
function open3D(){
 if(!cur||!MODELS[cur.it.id])return;
 if(!(window.THREE&&THREE.OrbitControls)){const id=cur.it.id,b=$("#v3dOpen");if(b)b.setAttribute("aria-busy","true");
  load3D().then(()=>{if(b)b.removeAttribute("aria-busy");if(cur&&cur.it.id===id)open3D_()}).catch(()=>{if(b)b.removeAttribute("aria-busy");const m=$("#v3dMsg");if(m){m.hidden=false;m.textContent="ما قدرنا نحمّل عارض 3D، جرّب مرة ثانية."}});return}
 open3D_()}
function open3D_(){
 if(!window.THREE||!cur)return;const m=MODELS[cur.it.id];if(!m)return;
 const st0=$("#v3dStage");if(!st0)return;if(V.on&&V.id===cur.it.id&&!st0.hidden){close3D();return}
 st0.hidden=false;$("#pv").style.visibility="hidden";V.on=true;
 const ci=cur.color&&!OUT.has(cur.color)?cur.color:(m.def||1);
 const st=$("#v3dStage");
 if(!V.renderer){
  try{V.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"})}catch(_){V.renderer=null;close3D();const nb=$("#v3dOpen");if(nb){nb.disabled=true;nb.title="جهازك أو متصفحك ما يدعم عرض 3D، شوف صور القطعة بالألوان"}return}
  V.renderer.domElement.addEventListener("webglcontextlost",ev=>ev.preventDefault());V.renderer.domElement.addEventListener("webglcontextrestored",()=>{V.act=performance.now()});V.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  V.renderer.outputEncoding=THREE.sRGBEncoding;V.renderer.toneMapping=THREE.NoToneMapping;
  V.scene=new THREE.Scene();V.cam=new THREE.PerspectiveCamera(35,1,0.1,5000);
  try{const pm=new THREE.PMREMGenerator(V.renderer);V.scene.environment=pm.fromScene(new THREE.RoomEnvironment(),0.04).texture;pm.dispose();V.env=true}catch(_){V.env=false}   /* soft studio reflections: plastic looks like plastic, not flat paint (falls back to the old lights if the device cannot build it) */
  const LI={h:0.1,k:0.46,r:0.24,f:0.14,e:0.38};V.LI=LI;   /* tuned by measuring piece colours against the old lights: within about 8/255 of the original colours, white keeps its relief */
  V.scene.add(new THREE.HemisphereLight(0xffffff,0x8a7f72,V.env?LI.h:0.42));
  const k=new THREE.DirectionalLight(0xffffff,V.env?LI.k:0.82);k.position.set(1.2,1.6,1.4);V.scene.add(k);const rim=new THREE.DirectionalLight(0xffffff,V.env?LI.r:0.45);rim.position.set(-1.4,0.4,-1.2);V.scene.add(rim);
  const f=new THREE.DirectionalLight(0xfff4e6,V.env?LI.f:0.35);f.position.set(-1.2,0.6,-0.6);V.scene.add(f);
  V.controls=new THREE.OrbitControls(V.cam,V.renderer.domElement);V.controls.enableDamping=true;V.controls.autoRotate=true;V.controls.autoRotateSpeed=1.6;V.controls.enablePan=false;V.controls.minPolarAngle=Math.PI*0.12;V.controls.maxPolarAngle=Math.PI*0.62;
  V.controls.addEventListener("start",()=>{V.controls.autoRotate=false;V.act=performance.now()});
  ["pointerdown","pointermove","wheel","touchstart"].forEach(ev=>V.renderer.domElement.addEventListener(ev,()=>{V.act=performance.now()},{passive:true}));
  addEventListener("resize",()=>{V.act=performance.now()});
  const loop=()=>{V.raf=requestAnimationFrame(loop);if(!(V.on&&document.getElementById("v3dStage")))return;
   const t=performance.now(),moved=V.controls.update();
   if(V.controls.autoRotate&&V.t0&&t-V.t0>15000)V.controls.autoRotate=false;   /* a spinning model for minutes only drains the battery */
   if(moved||t-(V.act||0)<1500||t-(V.idleT||0)>500){V.idleT=t;V.renderer.render(V.scene,V.cam)}};loop();
 }
 st.prepend(V.renderer.domElement);
 const r=st.getBoundingClientRect();V.renderer.setSize(r.width,r.height,false);V.cam.aspect=r.width/r.height;V.cam.updateProjectionMatrix();
 if(V.id===cur.it.id&&V.obj){tintMain(ci);set3DShade(cur.color2);partsUI();$("#v3dMsg")&&($("#v3dMsg").hidden=true);return}
 if(V.obj){V.scene.remove(V.obj);V.obj=null}if(V.shadow){V.scene.remove(V.shadow);V.shadow.material.map.dispose();V.shadow.material.dispose();V.shadow.geometry.dispose();V.shadow=null}
 V.id=cur.it.id;
 const done=obj=>{
  V.obj=obj;V.tint=[];V.tint2=[];V.parts=[];V.mainHex=null;
  obj.traverse(o=>{if(!o.isMesh)return;o.geometry.computeVertexNormals();
   const name=(o.name||o.parent&&o.parent.name||"").toLowerCase();
   const keep=(m.keep||[]).some(k=>name.includes(k.toLowerCase()));
   const old=o.material&&o.material.color?o.material.color.clone():new THREE.Color(0xffffff);
   o.material=new THREE.MeshStandardMaterial({color:old,roughness:0.5,metalness:0.0,envMapIntensity:(V.LI&&V.env?V.LI.e:0.45),side:THREE.DoubleSide,vertexColors:!!(o.geometry.attributes.color&&keep)});
   if(m.two&&name==="shade")V.tint2.push(o.material);else if(!keep)V.tint.push(o.material);if(keep&&!(m.two&&name==="shade"))V.parts.push({mat:o.material,orig:old.clone(),vc:o.material.vertexColors})});
  if(!V.tint.length)obj.traverse(o=>{if(o.isMesh)V.tint.push(o.material)});
  obj.rotation.x=m.up?0:-Math.PI/2;if(m.rotZ)obj.rotation.z=m.rotZ;/* print files are Z-up */
  const box=new THREE.Box3().setFromObject(obj),c=box.getCenter(new THREE.Vector3()),s=box.getSize(new THREE.Vector3());
  obj.position.sub(c);obj.position.y+=s.y*0.0;const d=Math.max(s.x,s.y,s.z);
  V.scene.add(obj);obj.updateMatrixWorld(true);V.t0=performance.now();V.controls.autoRotate=true;V.act=V.t0;
  {const cv=document.createElement("canvas");cv.width=cv.height=128;const g=cv.getContext("2d"),gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,"rgba(0,0,0,.34)");gr.addColorStop(.55,"rgba(0,0,0,.14)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(0,0,128,128);
   const tx=new THREE.CanvasTexture(cv),sh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false}));
   const r=Math.max(s.x,s.z)*1.5;sh.scale.set(r,r,1);sh.rotation.x=-Math.PI/2;sh.position.y=-s.y/2-d*0.002;sh.renderOrder=-1;V.scene.add(sh);V.shadow=sh}
  {/* frame the piece so it fills ~86% of the stage whatever its shape: move the camera back along a fixed view until every corner of its box fits */
   const dir=new THREE.Vector3(1.45,0.95,1.85).normalize().applyAxisAngle(new THREE.Vector3(0,1,0),m.az||0),hb=new THREE.Box3().setFromObject(obj),cs=[];
   obj.traverse(o=>{if(!o.isMesh||!o.geometry.attributes.position)return;const ps=o.geometry.attributes.position,st=Math.max(1,Math.floor(ps.count/2500));for(let i=0;i<ps.count;i+=st)cs.push(new THREE.Vector3().fromBufferAttribute(ps,i).applyMatrix4(o.matrixWorld))});
   if(!cs.length)for(let i=0;i<8;i++)cs.push(new THREE.Vector3(i&1?hb.max.x:hb.min.x,i&2?hb.max.y:hb.min.y,i&4?hb.max.z:hb.min.z));
   V.cam.near=d/100;V.cam.far=d*30;let best=0;
   for(let a=0;a<12;a++){/* it auto-rotates, so fit the worst angle */
    const ca=Math.cos(a*Math.PI/6),sa=Math.sin(a*Math.PI/6),rc=cs.map(p=>new THREE.Vector3(p.x*ca+p.z*sa,p.y,-p.x*sa+p.z*ca));let dist=d*2.6;
    for(let k=0;k<6;k++){V.cam.position.copy(dir).multiplyScalar(dist);V.cam.lookAt(0,0,0);V.cam.updateProjectionMatrix();V.cam.updateMatrixWorld(true);
     let m=0;rc.forEach(p=>{const q=p.clone().project(V.cam);m=Math.max(m,Math.abs(q.x),Math.abs(q.y))});
     if(!m)break;dist*=Math.max(0.5,Math.min(2,m/0.86))}
    best=Math.max(best,dist)}
   const dist=best||d*2.6;V.cam.position.copy(dir).multiplyScalar(dist);V.cam.lookAt(0,0,0);V.cam.updateProjectionMatrix();
   V.controls.minDistance=dist*0.4;V.controls.maxDistance=dist*2.2}
  V.controls.target.set(0,0,0);V.controls.autoRotate=true;
  tintMain(ci);set3DShade(cur.color2);partsUI();$("#v3dMsg").hidden=true};
 const fail=()=>{$("#v3dMsg").textContent="ما قدرنا نحمّل المجسم، جرّب مرة ثانية."};
 if(m.grid)fetch(m.file).then(r=>{if(!r.ok)throw 0;return r.json()}).then(d=>{const g=ringGrid(d);done(g.isObject3D?g:new THREE.Mesh(g,new THREE.MeshStandardMaterial()))}).catch(fail);
 else if(/\.stl$/i.test(m.file))new THREE.STLLoader().load(m.file,g=>{const g2=g;done(new THREE.Mesh(g2,new THREE.MeshStandardMaterial()))},undefined,fail);
 else new THREE.ThreeMFLoader().load(m.file,done,undefined,fail);
}
/* ring-grid model: rings of n points (int16, 0.01 mm), Z-up, bottom capped, top open */
function meshJson(d){if(d.keeps){   /* several fixed-colour parts (logo, text) + main body in the chosen colour */
  const grp=new THREE.Group();grp.add(new THREE.Mesh(meshJson(Object.assign({},d,{keeps:null})),new THREE.MeshStandardMaterial()));
  d.keeps.forEach(k=>{const m=new THREE.Mesh(meshJson(Object.assign({},d,{keeps:null,idx:k.idx})),new THREE.MeshStandardMaterial({color:new THREE.Color(k.color)}));m.name=k.name||"keep";grp.add(m)});return grp}
 if(d.keep){   /* two-colour print: main body follows the chosen colour, "keep" faces (e.g. white text) stay as printed */
  const grp=new THREE.Group(),a=meshJson(Object.assign({},d,{keep:null})),b=meshJson(Object.assign({},d,{keep:null,idx:d.keep}));
  grp.add(new THREE.Mesh(a,new THREE.MeshStandardMaterial()));const km=new THREE.Mesh(b,new THREE.MeshStandardMaterial({color:new THREE.Color(d.keepColor||"#ffffff")}));km.name="keep";grp.add(km);return grp}const dec=s=>{const r=atob(s),b=new Uint8Array(r.length);for(let i=0;i<r.length;i++)b[i]=r.charCodeAt(i);return b.buffer};
 const q=new Int16Array(dec(d.pos)),ix=d.i32?new Uint32Array(dec(d.idx)):new Uint16Array(dec(d.idx)),pos=new Float32Array(q.length);for(let i=0;i<q.length;i++)pos[i]=q[i]*d.scale;
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));g.setIndex(new THREE.BufferAttribute(new Uint32Array(ix),1));return g.toNonIndexed()}
function ringGrid(d){if(d.type==="mesh")return meshJson(d);const raw=atob(d.pos),b=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)b[i]=raw.charCodeAt(i);
 const q=new Int16Array(b.buffer),R=d.rings,n=d.n,pos=new Float32Array(q.length+3);for(let i=0;i<q.length;i++)pos[i]=q[i]*d.scale;
 const cen=q.length/3,idx=new Uint32Array((R-1)*n*6+n*3);let o=0;
 for(let l=0;l<R-1;l++)for(let k=0;k<n;k++){const a=l*n+k,bb=l*n+(k+1)%n,c=a+n,e=bb+n;idx[o++]=a;idx[o++]=c;idx[o++]=bb;idx[o++]=bb;idx[o++]=c;idx[o++]=e}
 for(let k=0;k<n;k++){idx[o++]=cen;idx[o++]=k;idx[o++]=(k+1)%n}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));g.setIndex(new THREE.BufferAttribute(idx,1));return g}
const PN={lampman:[["الغطاء العلوي","Top cover"]],pringles:[["الوجه والكتابة","Face & lettering"],["الشارب والعيون","Moustache & eyes"]],chips:[["الكتابة","Text"]],ttt:[["العلامات (X و O)","Marks (X & O)"]],ltr:[["الاسم والقلوب والزهرة","Name, hearts & flower"]],w1:[["الكأس","Cup"]],clips:[["الصحن الثاني","Second bowl"]]};
const pname=(i,id)=>{const a=PN[id||cur.it.id];return a&&a[i]?a[i][0]:"الجزء "+(i+2)};
const MN={lampman:"الجسم",pringles:"الجسم",chips:"الحامل",ttt:"اللوحة",ltr:"الحرف",w1:"المقبض",clips:"الصحن الأول"};
const PNAMES=[...new Set(Object.values(PN).flat().map(x=>x[0]))];
const partsTxt=()=>{const o=cur.pc||{},ks=Object.keys(o).filter(k=>o[k]);return ks.length?" · "+ks.map(k=>pname(+k)+": "+COLORS[o[k]][0]).join(" · "):""};
const ctxt=()=>COLORS[cur.color][0]+""+partsTxt();
/* part colours: models with extra parts (eyes, text, logo...) get a tab per part. Default = same colour as the main one; the customer may pick any of the colours. */
function applyParts(){V.act=performance.now();if(!cur||!V.parts||V.id!==cur.it.id)return;const pc=cur.pc||{};
 V.parts.forEach((p,k)=>{const hex=pc[k]?COLORS[pc[k]][1]:null;
  if(hex){p.mat.color.copy(new THREE.Color(hex).convertSRGBToLinear());if(p.mat.vertexColors){p.mat.vertexColors=false;p.mat.needsUpdate=true}}
  else{p.mat.color.copy(p.orig);if(p.mat.vertexColors!==p.vc){p.mat.vertexColors=p.vc;p.mat.needsUpdate=true}}})}
const FIXED_PARTS=new Set(["snoopy"]); /* parts that keep their colour; only the main mesh changes */
const PARTCOL=new Set([]); /* part tabs switched off by the owner (11-07) */
function partsUI(){const b=$("#partsBox"),mo=$("#mainOpt"),ph=$("#partHint");if(ph)ph.hidden=!(cur&&V.id===cur.it.id&&((V.parts&&V.parts.length)||(MODELS[cur.it.id]&&MODELS[cur.it.id].two)));if(!b)return;
 if(!cur||!V.parts||V.id!==cur.it.id||!PARTCOL.has(cur.it.id)){b.hidden=true;if(mo)mo.hidden=false;const st0=$("#v3dStage"),pv0=$("#pv");if(V.on&&cur&&V.id===cur.it.id){if(st0)st0.hidden=false;if(pv0)pv0.style.visibility="hidden"}return}

 if(!V.parts.length||FIXED_PARTS.has(cur.it.id)){/* single-part model: base colour (photo look) or another colour (3D preview) */
  const base=!cur.color,st=$("#v3dStage"),pv=$("#pv");if(mo)mo.hidden=base;b.hidden=false;
  const show3=!base||!!cur.v3;if(V.on){if(st)st.hidden=!show3;if(pv)pv.style.visibility=show3?"hidden":""}
  b.innerHTML=`<div class="ptabs" role="tablist"><button type="button" class="ptab" role="tab" data-sp="base" aria-pressed="${base}"><i style="background:conic-gradient(#e5484d,#f5c542,#46a758,#3e63dd,#e5484d)"></i>اللون الأساسي</button><button type="button" class="ptab" role="tab" data-sp="other" aria-pressed="${!base}"><i style="background:${COLORS[cur.color||MODELS[cur.it.id].def||1][1]}"></i>لون آخر</button></div>${base?`<button type="button" class="pcsame" data-sp="3d" aria-pressed="${show3}">${show3?"🖼 الصورة الأصلية":"🧊 معاينة ثلاثية الأبعاد"}</button><small class="pnote">${show3?"حرّك القطعة بإصبعك لتراها من كل الجهات.":"اللون الأساسي كما في الصورة الأصلية."}</small>`:""}`;return}
 cur.pc=cur.pc||{};const n=V.parts.length;if(cur.pt===undefined||cur.pt>=n)cur.pt=-2;const k=cur.pt,sel=k>=0?(cur.pc[k]||0):0;
 const dot=c=>"#"+c.clone().convertLinearToSRGB().getHexString(),mn=MN[cur.it.id]||"الجسم",mh=COLORS[cur.color][1]||"#ddd";
 if(mo)mo.hidden=k!==-1;b.hidden=false;
 const show3=k!==-2||!!cur.v3,st=$("#v3dStage"),pv=$("#pv");if(V.on){if(st)st.hidden=!show3;if(pv)pv.style.visibility=show3?"hidden":""}
 b.innerHTML=`<span class="lbl">اختر الجزء ثم لونه</span>
  <div class="ptabs" role="tablist"><button type="button" class="ptab" role="tab" data-pt="-2" aria-pressed="${k===-2}"><i style="background:conic-gradient(#e5484d,#f5c542,#46a758,#3e63dd,#e5484d)"></i>اللون الأساسي</button><button type="button" class="ptab" role="tab" data-pt="-1" aria-pressed="${k===-1}"><i style="background:${mh}"></i>${mn}</button>${V.parts.map((p,i)=>`<button type="button" class="ptab" role="tab" data-pt="${i}" aria-pressed="${i===k}"><i style="background:${cur.pc[i]?COLORS[cur.pc[i]][1]:dot(p.orig)}"></i>${pname(i)}</button>`).join("")}</div>
  ${k===-2?`<button type="button" class="pcsame" data-sp="3d" aria-pressed="${show3}">${show3?"🖼 الصورة الأصلية":"🧊 معاينة ثلاثية الأبعاد"}</button><small class="pnote">${show3?"حرّك القطعة بإصبعك لتراها من كل الجهات.":"الألوان كما في الصورة الأصلية. اختر جزءًا لتغيير لونه."}</small>`:""}
  ${k>=0?`<span class="lbl">${pname(k)}: <span id="pcname">${sel?COLORS[sel][0]:"اللون الأصلي"}</span></span><div class="sws">${COLORS.map((c,i)=>c[1]&&!OUT.has(i)?`<button type="button" class="sw3" style="background:${c[1]}" aria-label="${c[0]}" aria-pressed="${i===sel}" data-pc="${i}"></button>`:"").join("")}</div>`:""}`;applyParts()}
function set3DShade(i){V.act=performance.now();if(!cur||!COLORS[i]||!COLORS[i][1])return;cur.color2=i;const c=new THREE.Color(COLORS[i][1]).convertSRGBToLinear();(V.tint2||[]).forEach(mt=>mt.color.copy(c));document.querySelectorAll("#main .sw2").forEach(b=>b.setAttribute("aria-pressed",+b.dataset.s===i));if($("#cname2"))$("#cname2").textContent=COLORS[i][0];setTimeout(sumUI,0)}
function tintMain(i){V.act=performance.now();if(!window.THREE||!COLORS[i]||!COLORS[i][1])return;const c=new THREE.Color(COLORS[i][1]).convertSRGBToLinear();(V.tint||[]).forEach(mt=>mt.color.copy(c));V.mainHex=COLORS[i][1];applyParts()} /* tint the 3D main mesh without touching cur.color (used by "اللون الأساسي") */
function set3DColor(i){setTimeout(sumUI,0);if(!COLORS[i][1])return;
 const c=new THREE.Color(COLORS[i][1]).convertSRGBToLinear();(V.tint||[]).forEach(mt=>mt.color.copy(c));V.mainHex=COLORS[i][1];applyParts();
 document.querySelectorAll("#v3dSws .sw").forEach(b=>b.setAttribute("aria-pressed",+b.dataset.c3===i));$("#v3dCname")&&($("#v3dCname").textContent=COLORS[i][0]);
 if(cur){cur.color=i;document.querySelectorAll("#main .sw").forEach((b,j)=>b.setAttribute("aria-pressed",j===i));if($("#cname"))$("#cname").textContent=COLORS[i][0];paint();partsUI();const s3=document.getElementById("v3dStage")&&!document.getElementById("v3dStage").hidden?document.getElementById("v3dStage"):document.getElementById("pv");if(s3){const r3=s3.getBoundingClientRect(),hd=70;if(r3.top<hd||r3.bottom>innerHeight)window.scrollBy({top:r3.top-hd,behavior:"smooth"})}}}
function close3D(){V.on=false;const s=$("#v3dStage");if(s)s.hidden=true;const p=$("#pv");if(p)p.style.visibility="";const b=$("#v3dOpen");if(b){b.setAttribute("aria-pressed","false");b.innerHTML="<span>3D</span>"}}
/* wholesale threshold by piece weight: <100 g → 12 pcs, ≥100 g → 6 pcs (unknown weight → 12) */
/* a piece whose wholesale price equals its single price has no wholesale tier (WQ = Infinity: nothing is shown or applied) */
const WQ=id=>{if(PRICE[id]&&PRICE[id][1]>=PRICE[id][0])return Infinity;const it=ITEMS.find(i=>i.id===id);return it&&it.g>=100?6:12};
const isW=o=>o.qty>=WQ(o.id);
const UP=(id,q)=>PRICE[id]?(q>=WQ(id)?PRICE[id][1]:PRICE[id][0]):0;
const LT=o=>UP(o.id,o.qty)*o.qty;
const SAR=n=>`${n} ريال`;
const AR=n=>String(n);
function qtyUI(){setTimeout(sumUI,0);const w=WQ(cur.it.id);$("#qv").textContent=cur.qty;const b=$("#qb");if(!isFinite(w)){b.className="badge";b.textContent="";return}b.className="badge"+(cur.qty>=w?" on":"");b.textContent=cur.qty>=w?"سعر الجملة مفعّل لهذه القطعة ✓":`سعر الجملة من ${AR(w)} حبة من نفس القطعة (باقي ${w-cur.qty})`}
const isSP=o=>/^🎨 طلب خاص/.test((o&&o.note)||"");   /* special order (mixed colours): no fixed price, confirmed by message */
const PU=o=>isSP(o)?0:UP(o.id,o.qty);
const TOT=()=>cart.reduce((a,o)=>a+(isSP(o)?0:LT(o)),0);
function addLine(o){const ex=cart.find(x=>x.id===o.id&&x.ci===o.ci&&(x.size||"")===(o.size||"")&&(x.note||"")===(o.note||""));if(ex){ex.qty=Math.min(999,ex.qty+o.qty);return ex}cart.push(o);return o}   /* identical lines are merged so the wholesale quantity counts the total */
function cartUI(){if(!cart.length)OREF="";$("#cartN").textContent=cart.reduce((a,o)=>a+o.qty,0);try{localStorage.setItem("rax3d_cart",JSON.stringify(cart))}catch(_){}}
try{const s=JSON.parse(localStorage.getItem("rax3d_cart")||"[]");if(Array.isArray(s))s.forEach(o=>{if(o&&IMG[o.id]&&COLORS[o.ci]&&Number.isInteger(o.qty)&&o.qty>0&&o.qty<=9999&&cart.length<30)addLine({id:o.id,name:String(o.name).slice(0,80),color:/^🎨 طلب خاص/.test(String(o.note||""))?"ألوان متعددة":COLORS[o.ci][0],ci:o.ci,qty:o.qty,size:o.size||undefined,note:String(o.note||"").slice(0,200)})});if(cart.length)cartUI()}catch(_){}
/* ---------- order code: short and easy to keep (e.g. RX-7KM3Q). The order details travel in the message text itself,
   which the invoicing app reads when the whole message is pasted. Same code for the whole cart. ---------- */
let OREF="";
function orderCode(){if(!OREF){const A="ABCDEFGHJKMNPQRSTUVWXYZ23456789",r=new Uint32Array(5);crypto.getRandomValues(r);OREF="RX-"+[...r].map(x=>A[x%A.length]).join("")}return OREF}
function sizeText(o,en){if(o.size)return o.size+(en?" mm":" مم");const it=ITEMS.find(i=>i.id===o.id);return it&&it.d?(en?"Original — ":"الأصلي — ")+it.d.join(" × ")+(en?" mm":" مم"):(en?"Original":"الأصلي")}
function msgEN(){return "Hello RAX3D 👋\n\nI'd like to order the following:\n\n"+(CUST?`\n* Name: ${CUST.n}\n* Mobile: ${CUST.p}\n`:"")+cart.map(o=>`\n* Piece: ${tr(o.name)}\n* Colour: ${tr(o.color)}\n* Size: ${sizeText(o,true)}\n* Quantity: ${o.qty}${isW(o)?" (wholesale)":""}${isSP(o)?"\n* Price: to be confirmed by message (mixed colours)":UP(o.id,o.qty)?`\n* Price: ${LT(o)} SAR`:""}\n* Extra options: ${o.note||"None"}`).join("\n")+(cart.some(PU)?`\n\nTotal: ${TOT()} SAR`+(cart.some(isSP)?" (excluding the special order, priced by message)":""):"")+"\n\nThank you."}
let REDEEM=null,DELIV=false;const DELIV_FEE=25;
function msg(){let b=msgBase();if(DELIV){const pt=cart.every(o=>UP(o.id,o.qty))?cart.reduce((x,o)=>x+LT(o),0)+DELIV_FEE:0;const d=LANG==="en"?"\n\n* Delivery: I would like delivery. Delivery fee: "+DELIV_FEE+" SAR"+(pt?" (total with delivery: "+pt+" SAR)":"")+". Location to be agreed privately.":"\n\n* التوصيل: أبغى توصيل. رسوم التوصيل: "+DELIV_FEE+" ريال"+(pt?" (الإجمالي مع التوصيل: "+pt+" ريال)":"")+". نتفق على الموقع بالخاص.";const k=LANG==="en"?"\n\nThank you.":"\n\nشكرًا لكم.";b=b.endsWith(k)?b.slice(0,-k.length)+d+k:b+d}return b+(REDEEM?(LANG==="en"?"\n\n* Loyalty redemption: "+REDEEM.en:"\n\n* استبدال نقاط الولاء: "+REDEEM.ar):"")}
function msgBase(){if(LANG==="en")return msgEN();return "مرحبًا RAX3D 👋\n\nأرغب في تقديم الطلب التالي:\n\n"+(CUST?`\n* الاسم: ${CUST.n}\n* الجوال: ${CUST.p}\n`:"")+cart.map(o=>`\n* القطعة: ${o.name}\n* اللون: ${o.color}\n* المقاس: ${sizeText(o)}\n* الكمية: ${o.qty}${isW(o)?" (جملة)":""}${isSP(o)?"\n* السعر: يتحدد بالخاص (ألوان متعددة)":UP(o.id,o.qty)?`\n* السعر: ${LT(o)} ريال`:""}\n* خيارات إضافية: ${o.note||"لا يوجد"}`).join("\n")+(cart.some(PU)?`\n\nالإجمالي: ${TOT()} ريال`+(cart.some(isSP)?" (بدون الطلب الخاص، سعره يتحدد بالخاص)":""):"")+"\n\nشكرًا لكم."}

/* ---------- recolor: keeps the photo's light and shade, swaps only the printed part's colour ---------- */
/* every piece is pre-rendered in every colour at high resolution and checked by eye */
function prep(id){for(let i=1;i<COLORS.length;i++){const im=new Image();im.decoding="async";im.src=`hq/${id}-${i}.webp`}}
function paint(){setTimeout(sumUI,0);const p=$("#pv");if(!p||!cur)return;const src=`hq/${cur.it.id}-${cur.color}.webp`;if(p.getAttribute("src")!==src)p.src=src}

/* ---------- events ---------- */
document.addEventListener("click",e=>{   /* mixed-colour (special order) option on the item page */
 const t=e.target.closest("#mcBtn,.mcsw");if(!t||!cur)return;
 if(t.id==="mcBtn"){cur.mcOpen=!cur.mcOpen;$("#mcBox").hidden=!cur.mcOpen;t.setAttribute("aria-expanded",cur.mcOpen);t.querySelector("span").textContent=cur.mcOpen?"−":"+";sumUI();return}
 const i=+t.dataset.mc,k=cur.mc.indexOf(i);if(k>=0)cur.mc.splice(k,1);else if(cur.mc.length<6)cur.mc.push(i);else{toastMsg("الحد الأقصى 6 ألوان");return}
 t.setAttribute("aria-pressed",cur.mc.includes(i));const nm=cur.mc.map(x=>LANG==="en"?tr(COLORS[x][0]):COLORS[x][0]);$("#mcSelRow").hidden=!nm.length;$("#mcNames").textContent=nm.join(LANG==="en"?", ":"، ");sumUI()});
document.addEventListener("click",e=>{
 const t=e.target.closest("button");if(!t)return;
 if(t.id==="cartBtn"){if(hist[hi].v!=="cart")go({v:"cart"})}
 else if(t.hasAttribute("data-home")){closeDrawer();if(hist[hi].v!=="home")go({v:"home"})}
 else if(t.dataset.cat){closeDrawer();const v=hist[hi];if(!(v.v==="cat"&&v.cat===t.dataset.cat))go({v:"cat",cat:t.dataset.cat})}
 else if(t.dataset.var){hist[hi]={v:"item",id:t.dataset.var};render(false)}
 else if(t.dataset.open)go({v:"item",id:t.dataset.open})
 else if(t.dataset.del!==undefined){cart.splice(+t.dataset.del,1);cartUI();cartView()}
 else if(t.id==="copy"){navigator.clipboard.writeText(msg()).then(()=>{$("#toast").textContent="تم النسخ، الصقه في الخاص"}).catch(()=>{$("#toast").textContent=msg()})}
 else if(t.classList&&t.classList.contains("out")){toastMsg(COLORS[+(t.dataset.c||t.dataset.c3)][0]+" غير متوفر حالياً")}
 else if(cur&&t.dataset.sp==="3d"){cur.v3=!cur.v3;partsUI()}
 else if(cur&&t.dataset.sp!==undefined){cur.v3=false;const m=MODELS[cur.it.id],c=t.dataset.sp==="base"?0:(cur.color||m.def||1),bt=document.querySelector(`#main .sw[data-c="${c}"]`);if(bt)bt.click();if(c)set3DColor(c);else tintMain(m.def||1);partsUI()}
 else if(cur&&t.dataset.pt!==undefined){cur.pt=+t.dataset.pt;if(cur.pt===-2){cur.v3=false;cur.pc={};cur.pm={};const b0=document.querySelector("#main .sw[data-c=\"0\"]");if(b0)b0.click();tintMain(MODELS[cur.it.id].def||1);if(cur.it.id==="lampman")set3DShade(2)}partsUI()}
 else if(cur&&t.dataset.pc!==undefined){cur.pc=cur.pc||{};const k=cur.pt;if(k<0)return;cur.pc[k]=+t.dataset.pc;if(cur.it.id==="lampman")set3DShade(cur.pc[k]||2);partsUI();setTimeout(sumUI,0)}
 else if(cur&&t.dataset.s!==undefined){set3DShade(+t.dataset.s);if(!V.on)toastMsg("لون الغطاء يظهر في المعاينة ثلاثية الأبعاد 🧊")}
 else if(cur&&t.dataset.c!==undefined&&V.on&&COLORS[+t.dataset.c][1]){set3DColor(+t.dataset.c)}
 else if(cur&&t.dataset.c!==undefined){cur.color=+t.dataset.c;document.querySelectorAll(".sw").forEach((b,i)=>b.setAttribute("aria-pressed",i===cur.color));$("#cname").textContent=COLORS[cur.color][0];paint();partsUI()}
 else if(cur&&t.dataset.q){cur.qty=Math.max(1,Math.min(999,cur.qty+ +t.dataset.q));qtyUI()}
 else if(t.id==="menuBtn"){$("#rail").classList.contains("open")?closeDrawer():openDrawer()}
 else if(t.id==="railClose"){closeDrawer()}
 else if(t.id==="v3dOpen"){open3D()}
 else if(t.id==="v3dClose"){close3D()}
 else if(t.dataset.c3!==undefined&&!t.classList.contains("out")){set3DColor(+t.dataset.c3)}
 else if(t.id==="helpBtn"){$("#mbg").hidden=false;$("#mclose").focus()}
 else if(t.id==="mclose"||t.id==="mok"){$("#mbg").hidden=true}
 else if(cur&&t.id==="resetDim"){cur.dim=cur.it.d.slice();syncDims(-1)}
 else if(cur&&t.id==="otherBtn"){cur.other=!cur.other;$("#otherBox").hidden=!cur.other;t.setAttribute("aria-expanded",cur.other);t.querySelector("span").textContent=cur.other?"−":"+";if(cur.other)$("#note").focus()}
 else if(cur&&t.hasAttribute("data-add")){
  if(cur.sizeOn&&!dimsValid()){$("#dmsg").className="dmsg err";$("#dmsg").textContent="عدّل المقاس: كل محور من 1 إلى "+MAXD+" مم.";$("#sizeBox").scrollIntoView({behavior:"smooth",block:"center"});return}
  const sz=cur.sizeOn?cur.dim.map(v=>fmt(v)).join(" × "):"";
  const mcN=cur.mcOpen?cur.mc.map(i=>COLORS[i][0]):[];
  if(cur.mcOpen&&mcN.length<2){toastMsg("اختر لونين على الأقل للألوان المختلفة، أو أغلق الخيار");const mb=$("#mcBox");if(mb)mb.scrollIntoView({behavior:"smooth",block:"center"});return}
  let nt=cur.other?cur.note.trim():"";
  if(mcN.length){const mn=(($("#mcNote")||{}).value||"").trim().slice(0,110);nt=("🎨 طلب خاص — ألوان مختلفة: "+mcN.join("، ")+(mn?" | "+mn:"")+(nt?" | "+nt:"")).slice(0,200)}
  const line={id:cur.it.id,name:cur.it.name+(cur.it.vl?` (${cur.it.vl})`:""),color:mcN.length?"ألوان متعددة":ctxt(),ci:cur.color,qty:cur.qty,size:sz,note:nt};
  const same=cart.some(x=>x.id===line.id&&x.ci===line.ci&&(x.size||"")===(line.size||"")&&(x.note||"")===(line.note||""));
  if(!same&&cart.length>=40){toastMsg("السلة وصلت الحد الأقصى 40 سطرًا، أرسل الطلب بالخاص");return}
  const L=addLine(line);cartUI();
  const a=document.createElement("div");a.className="added";a.textContent=L.qty>line.qty?"أُضيفت لنفس القطعة في طلبك: الكمية الآن "+L.qty+(L.qty>=WQ(L.id)?" ✓ سعر الجملة":""):"أُضيفت للطلب ✓";document.body.appendChild(a);setTimeout(()=>a.remove(),L.qty>line.qty?2600:1400)}
});
document.addEventListener("click",e=>{const a=e.target.closest("a.dm,#chat");if(!a||!cart.length)return;
 try{navigator.clipboard.writeText(msg()).catch(()=>{})}catch(_){} });
document.addEventListener("change",e=>{
 if(cur&&e.target.id==="sizeOn"){cur.sizeOn=e.target.checked;$("#sizeBox").hidden=!cur.sizeOn;if(cur.sizeOn&&!cur.dim)cur.dim=cur.it.d?cur.it.d.slice():[null,null,null];syncDims(-1)}
 if(cur&&e.target.dataset&&e.target.dataset.dim!==undefined){const i=+e.target.dataset.dim;let v=parseFloat(e.target.value);if(v>MAXD){v=MAXD}if(isFinite(v)&&v>0){setDim(i,v)}syncDims(-1)}
});
document.getElementById("mbg").addEventListener("click",e=>{if(e.target.id==="mbg")e.target.hidden=true});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){$("#mbg").hidden=true;["#codbg","#paybg","#sbg","#pbg","#rbg","#cbg","#abg","#ibg"].forEach(s=>{const x=$(s);if(x)x.hidden=true});closeDrawer();close3D()}});
document.addEventListener("input",e=>{
 if(cur&&e.target.dataset&&e.target.dataset.dim!==undefined){const i=+e.target.dataset.dim,v=parseFloat(e.target.value);
  if(isFinite(v)&&v>0&&v<=MAXD){setDim(i,v);syncDims(i)}else{cur.dim[i]=isFinite(v)?v:null;syncDims(i)}}
});
document.addEventListener("input",e=>{if(cur&&e.target.id==="note"){cur.note=e.target.value.slice(0,200);$("#cnt").textContent=cur.note.length}});
/* ---------- optional customer sign-in: name + mobile only (no password), kept on the customer's own device and sent with the order.
   Loyalty: 1 point per riyal, tracked by mobile number in the invoicing app and printed on the invoice. ---------- */
let CUST=null;try{CUST=JSON.parse(localStorage.getItem("rax3d_cust")||"null")}catch(_){}
const normPhone=v=>{let d=String(v||"").replace(/[٠-٩]/g,c=>"٠١٢٣٤٥٦٧٨٩".indexOf(c)).replace(/\D/g,"");if(d.startsWith("00966"))d=d.slice(5);else if(d.startsWith("966"))d=d.slice(3);if(d.length===9&&d[0]==="5")d="0"+d;return d};
function openAcc(){loadPts();$("#cn").value=CUST?CUST.n:"";$("#cp").value=CUST?CUST.p:"";$("#amsg").textContent="";$("#amsg").className="dmsg";$("#aout").hidden=!CUST;$("#abg").hidden=false;setTimeout(()=>$("#cn").focus(),50)}
function saveAcc(){const n=$("#cn").value.trim().replace(/\s+/g," "),p=normPhone($("#cp").value),m=$("#amsg");
 $("#cn").setAttribute("aria-invalid",!n);$("#cp").setAttribute("aria-invalid",!/^05\d{8}$/.test(p));
 if(!n){m.className="dmsg err";m.textContent="اكتب اسمك.";return}
 if(!/^05\d{8}$/.test(p)){m.className="dmsg err";m.textContent="اكتب رقم جوال سعودي صحيح يبدأ بـ 05 (10 أرقام).";return}
 CUST={n:n.slice(0,40),p};try{localStorage.setItem("rax3d_cust",JSON.stringify(CUST))}catch(_){}
 $("#abg").hidden=true;render(false);loadPts();toastMsg("أهلاً "+CUST.n+"، تم التسجيل ✓")}
/* ---------- loyalty balance: read-only, published by the invoicing app as hashed mobiles in points.json ---------- */
let PTS=null;
const ptsTxt=()=>PTS==null?"":(LANG==="en"?"⭐ Your balance: "+PTS+" points":"⭐ رصيدك: "+PTS+" نقطة");
function paintPts(){const t=ptsTxt();document.querySelectorAll("[data-pts]").forEach(e=>{e.textContent=t;e.hidden=!t});document.querySelectorAll("[data-ptsn]").forEach(e=>{e.textContent=PTS==null?"":" · ⭐ "+PTS})}
/* key = PBKDF2-SHA256(normalised mobile, fixed app-wide salt, 300k iterations, 32-byte hex). MUST match ptsKey() in the invoicing app (/index.html). */
const PTS_SALT="RAX3D|loyalty-points|v2|7f3c9a1e",PTS_ITER=300000;
async function ptsKey(ph){const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(normPhone(ph)),"PBKDF2",false,["deriveBits"]);
 const b=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:new TextEncoder().encode(PTS_SALT),iterations:PTS_ITER},k,256);
 return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("")}
async function loadPts(){PTS=null;if(!CUST){paintPts();return}
 /* 1) the balance comes from the payment worker, which reads it from the private data repo (nothing public lists balances) */
 try{await CFGP}catch(_){}
 let ts=null;if(PAY.ts){try{ts=await tsToken()}catch(_){return}}   /* no proof, no look-up */
 try{const r=await fetch(PAY.api+"/points",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone:normPhone(CUST.p),ts})});
  const j=await r.json();if(j&&j.ok&&j.src==="private"){PTS=Math.max(0,+j.pts||0);paintPts();return}}catch(_){}
 /* worker unreachable or no private balance yet: show nothing (the public hashed file was removed) */
 paintPts()}
function logoutAcc(){CUST=null;PTS=null;try{localStorage.removeItem("rax3d_cust")}catch(_){}$("#abg").hidden=true;render(false)}
/* ---------- favourites (registered customers only, kept on the device under the customer's mobile) + share / copy link ---------- */
const favKey=()=>CUST?"rax3d_fav_"+CUST.p:null;
function favs(){try{const k=favKey();return k?(JSON.parse(localStorage.getItem(k)||"[]")||[]).filter(id=>ITEMS.some(i=>i.id===id)):[]}catch(_){return[]}}
const isFav=id=>favs().includes(id);
function toggleFav(id){if(!CUST){toastMsg("سجّل الدخول عشان تحفظ مفضلتك");openAcc();return}
 let f=favs();const had=f.includes(id);f=had?f.filter(x=>x!==id):[...f,id];try{localStorage.setItem(favKey(),JSON.stringify(f))}catch(_){}
 toastMsg(had?"انحذفت من المفضلة":"انضافت للمفضلة ♥");render(false)}
function favView(){const l=favs().map(id=>ITEMS.find(i=>i.id===id)).filter(Boolean);cur=null;$("#ttl").textContent="مفضلتي";
 $("#main").innerHTML=`<h2>مفضلتي</h2>`+(l.length?`<div class="grid">${l.map(card).join("")}</div>`:`<p class="note">ما أضفت شي للمفضلة للحين. اضغط ♡ على أي قطعة تعجبك.</p>`)}
const SITE_URL="https://rax3d.com/";const itemUrl=id=>SITE_URL+"?p="+encodeURIComponent(id);
async function copyText2(s){try{await navigator.clipboard.writeText(s);return true}catch(_){try{const a=document.createElement("textarea");a.value=s;a.style.cssText="position:fixed;opacity:0";document.body.appendChild(a);a.select();const ok=document.execCommand("copy");a.remove();return ok}catch(_){return false}}}
async function copyLink(id){toastMsg(await copyText2(itemUrl(id))?"تم نسخ الرابط ✓":"تعذّر النسخ")}
async function shareItem(id){const it=ITEMS.find(i=>i.id===id);if(!it)return;const data={title:it.name+" | RAX3D",text:it.name+"، من RAX3D",url:itemUrl(id)};
 if(navigator.share){try{await navigator.share(data);return}catch(e){if(e&&e.name==="AbortError")return}}
 copyLink(id)}
function toastMsg(s){const a=document.createElement("div");a.className="added";a.textContent=s;document.body.appendChild(a);setTimeout(()=>a.remove(),1800)}
document.addEventListener("click",e=>{const f=e.target.closest("[data-fav]");if(!f)return;e.stopImmediatePropagation();e.preventDefault();toggleFav(f.dataset.fav)},true);
document.addEventListener("click",e=>{const t=e.target.closest("button");if(!t)return;
 if(t.dataset.share)shareItem(t.dataset.share);else if(t.dataset.copylink)copyLink(t.dataset.copylink);else if(t.hasAttribute("data-favs")){closeDrawer();const v=hist[hi];if(v.v!=="fav")go({v:"fav"})}
 else if(t.hasAttribute("data-acc")){closeDrawer();openAcc()}else if(t.id==="aclose")$("#abg").hidden=true;else if(t.id==="asave")saveAcc();else if(t.id==="aout")logoutAcc()});
document.getElementById("abg").addEventListener("click",e=>{if(e.target.id==="abg")e.target.hidden=true});
document.getElementById("abg").addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.classList.contains("fin"))saveAcc()});
/* ---------- trust pages: returns, privacy, order tracking, contact ---------- */
const POL={
 ret:["سياسة الاستبدال والاسترجاع",`<p>كل قطعة نطبعها لك عند الطلب، باللون والمقاس اللي تختاره.</p><ul>
  <li>إذا وصلتك القطعة مكسورة، أو فيها عيب طباعة، أو تختلف عن طلبك في اللون أو المقاس، راسلنا خلال <b>3 أيام</b> من الاستلام مع صورة، ونعيد طباعتها أو نستبدلها مجاناً.</li>
  <li>لأن القطع تنصنع لك خصيصاً، ما نقبل الإرجاع بسبب تغيير الرأي بعد بدء الطباعة.</li>
  <li>تقدر تلغي طلبك مجاناً قبل ما نبدأ الطباعة.</li>
  <li>القطع المخصصة (اسم أو عبارة أو مقاس معدّل) تُستبدل فقط إذا فيها عيب.</li>
  <li>الفرق البسيط في درجة اللون أو ظهور خطوط الطبقات طبيعي في الطباعة ثلاثية الأبعاد، وما يُعتبر عيب.</li></ul>`],
 priv:["سياسة الخصوصية",`<ul>
  <li>الموقع ما يطلب منك إلا اسمك ورقم جوالك، والتسجيل اختياري.</li>
  <li>بياناتك تنحفظ في جهازك أنت، وما توصلنا إلا داخل رسالة طلبك.</li>
  <li>نستخدمها فقط لتجهيز طلبك وفاتورتك ونقاط الولاء، وما نشاركها أو نبيعها لأي جهة.</li>
  <li>الموقع ما يستخدم إعلانات ولا ملفات تتبع.</li>
  <li>تقدر تمسح بياناتك من «حسابي ← تسجيل الخروج»، أو تطلب منا بالخاص حذف سجلك.</li></ul>`],
 track:["متابعة الطلب",`<p>لما نعتمد طلبك ونصدر الفاتورة، يكون لطلبك <b>رقم طلب</b> مثل <span dir="ltr">ORD-125</span> مكتوب في الفاتورة.</p><ul>
  <li>أرسل رقم الطلب لنا بالخاص في أي وقت، ونرد عليك بحالة طلبك.</li>
  <li>مراحل الطلب: تم الاستلام ← تأكيد السعر ← قيد الطباعة ← جاهز للتسليم.</li>
  <li>مع التسليم توصلك فاتورة فيها رصيد نقاط الولاء حقك.</li></ul>`],
 contact:["تواصل معنا",`<ul>
  <li>انستقرام (الأسرع): <a href="https://www.instagram.com/rax3d.sa/" target="_blank" rel="noopener" dir="ltr">@rax3d.sa</a></li>
  <li>تيك توك: <a href="https://www.tiktok.com/@rax3d.sa" target="_blank" rel="noopener" dir="ltr">@rax3d.sa</a></li>
  <li>الإيميل: <a href="mailto:rax3d.sa@hotmail.com" dir="ltr">rax3d.sa@hotmail.com</a></li>
  <li>الموقع: المملكة العربية السعودية</li>
  <li>وثيقة العمل الحر: <span dir="ltr">FL-255870895</span></li></ul>
  <p class="muted">التسليم نتفق عليه معك قبل الطباعة.</p>`],
 faq:["الأسئلة الشائعة",`<details open><summary><b>كيف أطلب؟</b></summary><p>اختر القطعة واللون والمقاس والعدد وأضفها لطلبك، ثم ادفع أونلاين، أو اطلب بالدفع عند الاستلام، أو أرسل الطلب بالخاص في انستقرام أو تيك توك (الرسالة تنتسخ تلقائياً). نتواصل معك بتأكيد الطلب وموعد التجهيز.</p></details>
<details><summary><b>كم مدة التجهيز؟</b></summary><p>الطلب العادي يجهز خلال 3 إلى 7 أيام من تأكيد الطلب. طلبات الجملة مدتها حسب الطلب والعدد، ونتواصل معك بالخاص لتحديدها. بعدها نتفق معك على التسليم.</p></details>
<details><summary><b>هل يوجد توصيل؟</b></summary><p>الدفع أونلاين يشمل التوصيل برسوم 25 ريال. والدفع عند الاستلام استلام مباشر بدون رسوم. وإن أردت التوصيل مع الطلب بالخاص فاختر «أبغى توصيل» قبل «أرسل الطلب بالخاص»، ونتفق معك على الموقع والموعد.</p></details>
<details><summary><b>ما طرق الدفع؟</b></summary><p>مدى والبطاقات وApple Pay أونلاين، أو الدفع عند الاستلام كاش أو شبكة. وتقدر ترسل طلبك بالخاص ونتفق على الدفع معك.</p></details>
<details><summary><b>هل أقدر أختار لون القطعة؟</b></summary><p>أكيد. كل قطعة نطبعها لك عند الطلب باللون اللي تختاره من ألوان المتجر.</p></details>
<details><summary><b>هل أقدر أغيّر المقاس؟</b></summary><p>نعم، تقدر تعدّل مقاس القطعة حتى 255 مم من صفحتها.</p></details>
<details><summary><b>أقدر أشوف القطعة قبل الطلب؟</b></summary><p>للقطع اللي لها معاينة ثلاثية الأبعاد، لفّ القطعة بإصبعك وشوفها من كل جهة وغيّر اللون قبل ما تطلب.</p></details>
<details><summary><b>متى يتفعّل سعر الجملة؟</b></summary><p>يتفعّل تلقائياً إذا وصل طلبك إلى 12 حبة من نفس القطعة إذا وزنها أقل من 100 غرام، أو 6 حبات إذا وزنها 100 غرام أو أكثر.</p></details>
<details><summary><b>أقدر ألغي الطلب؟</b></summary><p>نعم، مجاناً قبل ما نبدأ الطباعة.</p></details>
<details><summary><b>وصلتني القطعة مكسورة أو فيها عيب، وش أسوي؟</b></summary><p>راسلنا خلال 3 أيام من الاستلام مع صورة، ونعيد طباعتها أو نستبدلها مجاناً. التفاصيل في «الاستبدال والاسترجاع».</p></details>
<details><summary><b>هل خطوط الطبقات عيب؟</b></summary><p>لا، ظهور خطوط الطبقات أو فرق بسيط في درجة اللون أمر طبيعي في الطباعة ثلاثية الأبعاد.</p></details>
<details><summary><b>كيف أتابع طلبي؟</b></summary><p>بعد اعتماد الطلب وإصدار الفاتورة يكون لطلبك رقم مثل <span dir="ltr">ORD-125</span>. أرسله لنا بالخاص ونرد عليك بحالة الطلب.</p></details>
<details><summary><b>كيف تشتغل نقاط الولاء؟</b></summary><p>تكسب نقطة على كل ريال. كل 1000 نقطة = خصم 10 ريال، و5000 نقطة = قطعة مجانية بقيمة حتى 250 ريال. تنتهي كل نقطة بعد 12 شهراً من تاريخ كسبها، ولا تُستبدل بمبالغ مالية.</p></details>
<details><summary><b>وش بياناتي اللي تحتاجونها؟</b></summary><p>اسمك ورقم جوالك فقط، والتسجيل اختياري.</p></details>
<p class="muted">التسليم نتفق عليه معك قبل الطباعة. عندك سؤال ثاني؟ راسلنا من «تواصل معنا».</p>`],
};
const POL_EN={
 ret:["Returns & exchanges",`<p>Every piece is printed to order, in the colour and size you choose.</p><ul><li>If your piece arrives broken, with a print defect, or different from your order (colour or size), message us within <b>3 days</b> of delivery with a photo and we'll reprint or replace it free.</li><li>Because pieces are made for you, we can't accept returns for a change of mind once printing has started.</li><li>You can cancel free of charge before printing starts.</li><li>Custom pieces (names, text or a changed size) are replaced only if defective.</li><li>Slight colour variation or visible layer lines are normal in 3D printing and aren't defects.</li></ul>`],
 priv:["Privacy policy",`<ul><li>The site only asks for your name and mobile, and signing in is optional.</li><li>Your details stay on your own device and only reach us inside your order message.</li><li>We use them only to prepare your order, invoice and loyalty points, and never share or sell them.</li><li>No ads and no tracking cookies.</li><li>Clear your details from “My account → Sign out”, or ask us by DM to delete your record.</li></ul>`],
 track:["Track your order",`<p>Once we confirm your order and issue the invoice, your order gets an <b>order number</b> like ORD-125, printed on the invoice.</p><ul><li>Send us your order number by DM any time and we'll reply with your order status.</li><li>Stages: received → price confirmed → printing → ready for delivery.</li><li>On delivery you get an invoice showing your loyalty points balance.</li></ul>`],
 contact:["Contact us",`<ul><li>Instagram (fastest): <a href="https://www.instagram.com/rax3d.sa/" target="_blank" rel="noopener">@rax3d.sa</a></li><li>TikTok: <a href="https://www.tiktok.com/@rax3d.sa" target="_blank" rel="noopener">@rax3d.sa</a></li><li>Email: <a href="mailto:rax3d.sa@hotmail.com">rax3d.sa@hotmail.com</a></li><li>Location: Saudi Arabia</li><li>Freelance licence: FL-255870895</li></ul><p class="muted">Price, payment and delivery are agreed with you by DM before printing.</p>`],
 faq:["FAQ",`<details open><summary><b>How do I order?</b></summary><p>Pick the piece, colour, size and quantity and add it to your order, then send the order by DM on Instagram or TikTok (the message is copied for you). We reply to confirm your order and the preparation date, and payment is after we agree.</p></details>
<details><summary><b>Can I choose the colour?</b></summary><p>Yes. Every piece is printed to order in the colour you pick from the store colours.</p></details>
<details><summary><b>Can I change the size?</b></summary><p>Yes, you can adjust a piece's size up to 255 mm on its page.</p></details>
<details><summary><b>Can I see the piece before ordering?</b></summary><p>For pieces with a 3D preview, spin the piece with your finger, view it from every side and change the colour before you order.</p></details>
<details><summary><b>When does the wholesale price apply?</b></summary><p>It applies automatically when your order reaches 12 pcs of the same piece if it weighs under 100 g, or 6 pcs if it weighs 100 g or more.</p></details>
<details><summary><b>How long does preparation take?</b></summary><p>A regular order is ready within 3 to 7 days of confirmation. For wholesale orders the time depends on the order and quantity, and we contact you by message to agree it. Then we arrange the handover with you.</p></details>
<details><summary><b>Can I cancel my order?</b></summary><p>Yes, free of charge before printing starts.</p></details>
<details><summary><b>My piece arrived broken or defective. What do I do?</b></summary><p>Message us within 3 days of delivery with a photo and we'll reprint or replace it free. See “Returns &amp; exchanges” for details.</p></details>
<details><summary><b>Are layer lines a defect?</b></summary><p>No. Visible layer lines or a slight colour variation are normal in 3D printing.</p></details>
<details><summary><b>How do I track my order?</b></summary><p>Once the order is confirmed and the invoice is issued, it gets an order number like <span dir="ltr">ORD-125</span>. Send it to us by DM and we'll reply with its status.</p></details>
<details><summary><b>How do loyalty points work?</b></summary><p>You earn 1 point per riyal. Every 1000 points = 10 SAR off, and 5000 points = a free piece worth up to 250 SAR. Each point expires 12 months after it is earned and can't be exchanged for cash.</p></details>
<details><summary><b>What details do you need from me?</b></summary><p>Only your name and mobile number, and signing in is optional.</p></details>
<p class="muted">Price, payment and delivery are agreed with you by DM before printing. Another question? Message us from “Contact us”.</p>`],
};
function openPol(k){const p=(LANG==="en"?POL_EN:POL)[k];if(!p)return;$("#pt").textContent=p[0];$("#pbody").innerHTML=p[1];$("#pbg").hidden=false}
document.addEventListener("click",e=>{const t=e.target.closest("button");if(!t)return;
 if(t.dataset.edit){go({v:"edit",id:t.dataset.edit});return}
 if(t.dataset.pol)openPol(t.dataset.pol);else if(t.id==="pclose"||t.id==="pok")$("#pbg").hidden=true;
 else if(t.hasAttribute("data-shop")){const h=document.getElementById("newHd");if(h)h.scrollIntoView({behavior:"smooth",block:"start"})}});
document.getElementById("pbg").addEventListener("click",e=>{if(e.target.id==="pbg")e.target.hidden=true});
document.getElementById("rbg").addEventListener("click",e=>{if(e.target.id==="rbg")e.target.hidden=true});
/* ---------- send order: copy the message, then show the steps and open Instagram ---------- */
function copyText(s){const old=()=>{const ta=document.createElement("textarea");ta.value=s;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();try{document.execCommand("copy")}catch(_){}ta.remove();return Promise.resolve()};
 try{if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(s).catch(old)}catch(_){}   /* if the browser refuses the modern copy, fall back instead of leaving an unhandled error */
 return old()}
document.addEventListener("click",e=>{const t=e.target.closest("button,a");if(!t)return;
 if(t.id==="sendBtn"&&cart.length){REDEEM=null;{const c=document.getElementById("delChk");DELIV=!!(c&&c.checked)}copyText(msg());$("#sbg").hidden=false}
 else if(t.id==="sclose")$("#sbg").hidden=true;
 else if(t.id==="rclose"){$("#rbg").hidden=true}
 else if(t.hasAttribute("data-pnone")||t.dataset.predeem!==undefined){const k=t.dataset.predeem;if(k===undefined)REDEEM=null;else{const[kind,n]=k.split(":");const nn=+n;REDEEM=kind==="free"?{ar:"قطعة مجانية بقيمة حتى 250 ريال (5000 نقطة)",en:"a free piece worth up to 250 SAR (5000 points)"}:{ar:`خصم ${nn*10} ريال (${nn*1000} نقطة)`,en:`${nn*10} SAR off (${nn*1000} points)`}}
  $("#rbg").hidden=true;copyText(msg());const h=PCH;PCH=null;if(h)window.open(h,"_blank","noopener");$("#sbg").hidden=true}
 else if(t.id==="sgo"||t.id==="sgt"){copyText(msg());setTimeout(()=>{$("#sbg").hidden=true},400)}
 else if(t.id==="cclose")$("#cbg").hidden=true;
 else if(t.id==="cig"||t.id==="ctt"){setTimeout(()=>{$("#cbg").hidden=true},400)}});
/* loyalty: after the visitor picks Instagram/TikTok, offer to use points when the balance allows */
let PCH=null;
document.addEventListener("click",e=>{const a=e.target.closest("#sgo,#sgt");if(!a)return;
 if(CUST&&PTS!=null&&PTS>=1000){e.preventDefault();PCH=a.href;openPtsOffer()}},true);
function openPtsOffer(){const L=LANG==="en",k=Math.min(Math.floor(PTS/1000),5);
 $("#rt").textContent=L?"Use your points? ⭐":"تبي تستخدم نقاطك؟ ⭐";
 $("#rn").textContent=L?`Your balance is ${PTS} points. Choose how to use them with this order, or continue without.`:`رصيدك ${PTS} نقطة. اختر كيف تستخدمها مع هذا الطلب، أو كمّل بدونها.`;
 let h="";for(let n=1;n<=k;n++)h+=`<button type="button" class="btn gold" data-predeem="disc:${n}" style="margin-top:8px">${L?`${n*10} SAR off (${n*1000} points)`:`خصم ${n*10} ريال (${n*1000} نقطة)`}</button>`;
 if(PTS>=5000)h+=`<button type="button" class="btn gold" data-predeem="free:1" style="margin-top:8px">${L?"Free piece worth up to 250 SAR (5000 points)":"قطعة مجانية بقيمة حتى 250 ريال (5000 نقطة)"}</button>`;
 $("#popts").innerHTML=h;$("#rbg").hidden=false}
/* chat bubble + follow banner: let the visitor pick Instagram or TikTok */
function pickChannel(follow){const L=LANG==="en";
 $("#ct").textContent=follow?(L?"Follow us on":"تابعنا على"):(L?"Message us on":"راسلنا عن طريق");
 $("#cig").href=follow?"https://www.instagram.com/rax3d.sa/":"https://ig.me/m/rax3d.sa";
 $("#ctt").href="https://www.tiktok.com/@rax3d.sa";
 $("#cig").textContent=L?"Instagram":"انستقرام";$("#ctt").textContent=L?"TikTok":"تيك توك";
 $("#cnote").textContent=(!follow&&cart.length)?(L?"Your order message is copied — paste it in the chat. On TikTok open our profile and tap Message.":"نسخنا رسالة طلبك، الصقها في المحادثة. في تيك توك ادخل حسابنا واضغط رسالة."):(follow?"":(L?"On TikTok open our profile and tap Message.":"في تيك توك ادخل حسابنا واضغط رسالة."));
 $("#cbg").hidden=false}
document.addEventListener("click",e=>{const a=e.target.closest("#chat,#promo");if(!a)return;e.preventDefault();
 if(a.id==="chat"&&cart.length){DELIV=false;copyText(msg())}pickChannel(a.id==="promo")});
/* ---------- install as an app (PWA): one-tap where the browser allows it, otherwise steps written for the visitor's own browser ---------- */
const INST={evt:null,standalone:matchMedia("(display-mode: standalone)").matches||navigator.standalone===true};
const UA=navigator.userAgent,IOS=/iPhone|iPad|iPod/.test(UA)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const AND=/Android/.test(UA),MAC=/Macintosh/.test(UA)&&!IOS,WIN=/Windows/.test(UA);
const BR=/Edg\//.test(UA)?"edge":/SamsungBrowser/.test(UA)?"samsung":/CriOS|Chrome\//.test(UA)?"chrome":/FxiOS|Firefox/.test(UA)?"firefox":/Safari/.test(UA)?"safari":"other";
const SH='<svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7"/></svg>',DOTS='<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>';
addEventListener("beforeinstallprompt",e=>{e.preventDefault();INST.evt=e});
addEventListener("appinstalled",()=>{INST.evt=null;showInstalled()});
const where=()=>IOS||AND?"على الشاشة الرئيسية لجوالك":MAC?"في الـ Dock وفي مجلد التطبيقات":WIN?"على سطح المكتب وفي قائمة ابدأ":"بين تطبيقات جهازك";
function stepsFor(){const s=[];
 if(IOS){
  if(BR==="safari"){s.push(`اضغط زر المشاركة <span class="k">${SH} مشاركة</span> أسفل الشاشة (أو أعلاها في الآيباد).`);}
  else s.push(`اضغط زر المشاركة <span class="k">${SH}</span> في شريط المتصفح.`);
  s.push(`انزل في القائمة واختر <span class="k">إضافة إلى الشاشة الرئيسية</span>.`);
  s.push(`اضغط <span class="k">إضافة</span> فوق على اليمين.`);
 }else if(AND){
  s.push(`اضغط القائمة <span class="k">${DOTS}</span> في أعلى المتصفح.`);
  s.push(`اختر <span class="k">تثبيت التطبيق</span> أو <span class="k">إضافة إلى الشاشة الرئيسية</span>.`);
  s.push(`اضغط <span class="k">تثبيت</span> للتأكيد.`);
 }else if(MAC&&BR==="safari"){
  s.push(`من شريط القوائم فوق اختر <span class="k">ملف</span> (File).`);
  s.push(`اختر <span class="k">إضافة إلى Dock</span> (Add to Dock).`);
  s.push(`اضغط <span class="k">إضافة</span>.`);
 }else if(BR==="chrome"||BR==="edge"){
  s.push(`اضغط القائمة <span class="k">${DOTS}</span> في أعلى المتصفح (أو أيقونة التثبيت <span class="k">⊕</span> في طرف شريط العنوان).`);
  s.push(`اختر <span class="k">${BR==="edge"?"التطبيقات ← تثبيت هذا الموقع كتطبيق":"إرسال وحفظ ومشاركة ← تثبيت الصفحة كتطبيق"}</span>.`);
  s.push(`اضغط <span class="k">تثبيت</span>.`);
 }else{
  s.push(`متصفحك الحالي ما يدعم تثبيت التطبيقات.`);
  s.push(`افتح هذا الرابط في <b>Chrome</b> أو <b>Edge</b> (أو <b>Safari</b> في الآيفون)، وارجع لهذا الزر.`);
 }
 return s}
function openInstall(){const b=$("#ibody");
 if(INST.standalone){b.innerHTML=`<p>أنت فاتح التطبيق حالياً ✓</p>`}
 else if(INST.evt){b.innerHTML=`<p>بضغطة وحدة نثبت لك تطبيق RAX3D ${where()}، ويفتح مثل أي برنامج بدون متصفح.</p><button type="button" class="btn gold" id="igo">ثبّت التطبيق الحين</button><p class="inote">جهازك يعرض عليك نافذة صغيرة، اضغط فيها «تثبيت».</p>`}
 else{b.innerHTML=`<p>نضيف لك تطبيق RAX3D ${where()} بثلاث خطوات:</p><ol class="ist">${stepsFor().map(x=>`<li><span>${x}</span></li>`).join("")}</ol><p class="inote">التطبيق مجاني وخفيف، ما يحتاج متجر تطبيقات ولا يطلب أي صلاحيات.</p><button type="button" class="btn gold" id="iok">تمام</button>`}
 $("#ibg").hidden=false}
function showInstalled(){$("#ibody").innerHTML=`<div class="idone">✅</div><h3 style="text-align:center">تم تحميل التطبيق</h3>
 <p>لقيته ${where()} باسم <b>RAX3D</b> وبهذا الشعار:</p><p style="text-align:center"><img src="icon-192.png" alt="" width="64" height="64" style="border-radius:16px"></p>
 <ol class="ist"><li><span>جهازك أضاف أيقونة التطبيق ${where()}.</span></li><li><span>اضغطها في أي وقت ويفتح لك المتجر مباشرة كتطبيق مستقل.</span></li><li><span>تبي تحذفه؟ احذف الأيقونة مثل أي تطبيق.</span></li></ol>
 <button type="button" class="btn gold" id="iok">تمام</button>`;$("#ibg").hidden=false;document.querySelectorAll("[data-inst]").forEach(x=>x.remove())}
document.addEventListener("click",async e=>{const t=e.target.closest("button");if(!t)return;
 if(t.hasAttribute("data-inst")){closeDrawer();openInstall()}
 else if(t.id==="iclose"||t.id==="iok"){$("#ibg").hidden=true}
 else if(t.id==="igo"&&INST.evt){const ev=INST.evt;INST.evt=null;ev.prompt();const r=await ev.userChoice.catch(()=>null);if(r&&r.outcome==="accepted")showInstalled();else $("#ibg").hidden=true}});
document.getElementById("ibg").addEventListener("click",e=>{if(e.target.id==="ibg")e.target.hidden=true});
if("serviceWorker" in navigator){const had=!!navigator.serviceWorker.controller;let rl=0;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(had&&!rl){rl=1;location.reload()}});addEventListener("load",()=>navigator.serviceWorker.register("sw.js").then(r=>r.update()).catch(()=>{}))}
/* ---------- language: Arabic (default) / English. Arabic text stays in the code; in English mode every rendered
   text node and label is swapped through EN (exact phrases) and RX (phrases with numbers). Numbers are Western everywhere. ---------- */
const EN={"+ الطلب الخاص (سعره يتحدد بالخاص)":"+ the special order (price confirmed by message)","السعر: يتحدد بالخاص (ألوان متعددة)":"Price: confirmed by message (mixed colours)","🎨 ألوان مختلفة للقطع (طلب خاص)":"🎨 Different colours for the parts (special order)","اختر الألوان اللي تبيها، واكتب أي جزء بأي لون. سعر الألوان المتعددة يختلف عن السعر المعروض، ونتواصل معك بالخاص لتأكيد السعر والتفاصيل.":"Pick the colours you want and say which part gets which. The price for mixed colours differs from the listed price; we contact you by message to confirm the price and details.","الألوان المختارة:":"Selected colours:","مثال: الغطاء أسود والباقي أبيض":"Example: black lid, everything else white","اختر لونين على الأقل للألوان المختلفة، أو أغلق الخيار":"Pick at least two colours, or close the option","الحد الأقصى 6 ألوان":"Up to 6 colours","ألوان متعددة":"Multiple colours","🎨 فيه طلب خاص (ألوان مختلفة): سعره يختلف عن السعر المعروض. أرسل الطلب بالخاص ونتواصل معك لتأكيد السعر والتفاصيل.":"🎨 Your order has a special request (mixed colours): its price differs from the listed price. Send the order by message and we will contact you to confirm the price and details.","💡 تقدر تغيّر الأجزاء أو الكتابات بلون مختلف: اختر «ألوان مختلفة للقطع» تحت.":"💡 You can change parts or lettering to a different colour: use \"Different colours for the parts\" below.","بعد طلبك بالدفع عند الاستلام نتواصل معك للتنسيق على مكان الاستلام وموعده.":"After you place a cash-on-delivery order we contact you to arrange the pickup place and time.","صينية هارلي لحفظ الأغراض":"Harley Catch-All Tray","صينية بتصميم هارلي مجنّح، لحفظ المفاتيح والمحفظة والعملات والسماعات":"Winged Harley-style tray for keys, wallet, coins and earbuds","مجسم هارلي المتحرك":"Articulated Harley Buddy","شعار هارلي بأرجل متحركة، يُطبع جاهزًا بدون تركيب، هدية ظريفة للمكتب أو السيارة":"Harley logo with movable legs, printed ready with no assembly, a fun gift for a desk or car","غطاء مناديل هارلي":"Harley Tissue Box Cover","غطاء علبة مناديل بشعار هارلي وخطوط برتقالية على الجانبين، للديكور والضيافة":"Tissue box cover with the Harley logo and orange stripes on both sides, for decor and hosting","ساعة هارلي ديفيدسون الجدارية":"Harley-Davidson Wall Clock","ساعة جدارية بشعار هارلي ديفيدسون ثلاثي الأبعاد، عرضها 25 سم ومعها ميكانيزم الساعة، لغرف المحبين والمرآب":"Wall clock with the 3D Harley-Davidson logo, 25 cm wide, with the clock mechanism, for fans' rooms and garages","صندوق عدة هارلي (حامل أقلام)":"Harley Toolbox (Pen Holder)","صندوق عدة مصغّر بشعار هارلي: غطاء متحرك وأدراج ديكور ومنظّم علوي بـ 15 فتحة دائرية، لحفظ الأقلام والأدوات الصغيرة":"Miniature toolbox with the Harley logo: hinged lid, decorative drawers and a top organizer with 15 round slots, for pens and small tools","تقدر تغيّر الأجزاء أو الكتابات بلون مختلف: اذكر ذلك في خانة «تفاصيل إضافية قبل الطباعة» تحت.":"You can change parts or lettering to a different colour: mention it in the \"Extra details before printing\" box below.","تفاصيل إضافية قبل الطباعة":"Extra details before printing","كوب ويلسون تيكي":"Wilson Tiki Mug","كوب تيكي بوجه ويلسون، يتسع لكوب بلاستيك 9 أونس يوضع بداخله، للديكور والضيافة":"Tiki mug with Wilson's face. A 9 oz plastic cup sits inside it, for decor and hosting","لون الغطاء العلوي":"Lampshade colour","لون الغطاء العلوي: ":"Lampshade colour: ","لون الغطاء يظهر في المعاينة ثلاثية الأبعاد 🧊":"The shade colour shows in the 3D preview 🧊","قناع اليقطين":"Pumpkin mask","قناع يقطين مرعب للهالوين، للارتداء أو التعليق":"Scary Halloween pumpkin mask, wearable or wall-hung","مقاس L":"Size L","مقاس M":"Size M","مقاس S":"Size S","المقاس":"Size","210 مم":"210 mm","183 مم":"183 mm","157 مم":"157 mm","أومني دريبر 2 (نيقوشيتر) xBloom Studio":"Omni Dripper 2 for xBloom Studio","طقم 3 مقابض ريترو xBloom Studio":"Set of 3 Retro Knobs for xBloom Studio","طقم حامل وكوب جانبي مع غطاء xBloom":"xBloom Holder and Side Cup Set with Lid","لوحة سنوبي تشيل":"Snoopy Chill Wall Panel","لوحة جدارية بأربعة ألوان، كلمة CHILL بلونك، للغرفة أو المكتب":"Four-colour wall panel, with the CHILL word in the colour you choose, for a room or a desk","كوب أقلام أفنجرز":"AVENGERS Pen Holder","كوب أقلام بشعار أفنجرز، يرتّب مكتبك وهدية لمحبي مارفل":"Pen holder with the Avengers logo, keeps your desk tidy and makes a gift for Marvel fans","كوب الجمجمة الصارخة":"Screaming Skull Mug","كوب بوجه جمجمة وزخارف، للديكور أو حفظ الأقلام":"Mug with a skull face and ornaments, for decor or holding pens","إكسسوارات ألعاب الفيديو":"Video game accessories","RAX3D متجر سعودي للطباعة ثلاثية الأبعاد (طباعة 3D): مزهريات وديكور للمنزل والمكتب، هدايا مميزة وكؤوس، ميداليات مفاتيح، صفارات، وإكسسوارات قهوة xBloom. تختار القطعة واللون والمقاس، وتشوفها ثلاثية الأبعاد قبل الطلب، ونطبعها لك حسب الطلب. نقبل الطلبات بالقطعة وبالجملة للمحلات والتوزيعات.":"RAX3D is a Saudi 3D printing shop: vases and decor for home and office, distinctive gifts and trophies, key chains, whistles and xBloom coffee accessories. You pick the piece, colour and size, see it in 3D before ordering, and we print it for you on demand. We accept orders by the piece and wholesale for shops and giveaways.","أكّد طلبك":"Confirm your order","ادفع أونلاين (مدى، Apple Pay)، أو اطلب بالدفع عند الاستلام، أو أرسل الطلب بالخاص في انستقرام أو تيك توك.":"Pay online (mada, Apple Pay), order with cash on delivery, or send the order by DM on Instagram or TikTok.","نتواصل معك بتأكيد الطلب وموعد التجهيز.":"We'll contact you to confirm your order and ready date.","نتواصل معك بتأكيد الطلب. التجهيز من 3 إلى 7 أيام، وطلبات الجملة مدتها حسب الطلب والعدد ونتواصل معك بالخاص لتحديدها.":"We contact you to confirm your order. Preparation takes 3 to 7 days; for wholesale orders the time depends on the order and quantity, and we contact you by message to agree it.","🔒 دفع آمن بمدى و Apple Pay":"🔒 Secure payment with mada and Apple Pay","💵 الدفع عند الاستلام متاح":"💵 Cash on delivery available","🔁 استبدال مجاني خلال 3 أيام لو فيها عيب":"🔁 Free replacement within 3 days if it arrives defective","ما طرق الدفع؟":"What payment methods are there?","التسليم نتفق عليه معك قبل الطباعة.":"We agree delivery with you before printing.","ادفع الحين · مدى · Apple Pay":"Pay now · mada · Apple Pay","اطلب والدفع عند الاستلام":"Order & pay on delivery","الدفع الإلكتروني":"Online payment","الدفع عند الاستلام":"Cash on delivery","متابعة للدفع":"Continue to payment","تأكيد الطلب":"Confirm order","الدفع عبر ميسر (مدى، البطاقات، Apple Pay). ما نحفظ بيانات بطاقتك.":"Payment via Moyasar (mada, cards, Apple Pay). We never store your card details.","تدفع المبلغ كاش أو شبكة عند استلام الطلب. نتواصل معك لتأكيد التجهيز وموعد الاستلام.":"You pay cash or by card when you receive the order. We'll contact you to confirm preparation and the pickup time.","تأكد من الاسم والجوال.":"Please check your name and mobile number.","الطلبات الكبيرة ما تمشي بالدفع عند الاستلام، ادفع أونلاين أو أرسل الطلب بالخاص.":"Large orders can't use cash on delivery. Pay online or send the order by DM.","جاري إرسال طلبك…":"Sending your order…","عبّي الاسم والجوال (05xxxxxxxx).":"Enter your name and mobile (05xxxxxxxx).","ما تم إرسال الطلب، جرّب مرة ثانية أو أرسله بالخاص.":"The order was not sent. Try again or send it by DM.","ما فيه اتصال، جرّب مرة ثانية.":"No connection, please try again.","وصلت للحد اليومي لطلبات الدفع عند الاستلام. تواصل معنا بالخاص.":"You've reached the daily limit for cash-on-delivery orders. Please DM us.","وصلنا طلبك ✓":"We got your order ✓","تم الدفع ✓":"Payment received ✓","جاري تأكيد طلبك…":"Confirming your order…",". بنتواصل معك لتأكيد التجهيز وموعد الاستلام، وتدفع عند الاستلام.":". We'll contact you to confirm preparation and the pickup time. You pay on pickup.","تبي تستخدم نقاطك؟ ⭐":"Use your points? ⭐","لا، كمّل بدون استخدام النقاط":"No, continue without points","كل 1000 نقطة = خصم 10 ريال":"Every 1000 points = 10 SAR off","5000 نقطة = قطعة مجانية بقيمة حتى 250 ريال":"5000 points = a free piece worth up to 250 SAR","تنتهي كل نقطة بعد 12 شهراً من تاريخ كسبها":"Each point expires 12 months after it is earned","النقاط لا تُستبدل بمبالغ مالية":"Points cannot be exchanged for cash","نقاط الولاء":"Loyalty points","طباعة ثلاثية الأبعاد في السعودية":"3D printing in Saudi Arabia","سجّل الآن واكسب نقاط ولائك، استبدلها بخصومات وجوائز":"Sign up now and earn loyalty points, redeem them for discounts and prizes","بدون رقم سري، اسمك وجوالك بس ⭐":"No password — just your name and mobile ⭐","لعبة إكس أو":"Tic-Tac-Toe Game","لعبة إكس أو بحجم الجيب، تركيبها بدون غراء":"Pocket-size Tic-Tac-Toe, assembles without glue","كأس بطولة FNCS":"FNCS Championship Trophy","كأس مجسّم بشعار FNCS على قاعدة":"Trophy with the FNCS logo on a base","كأس السمكة الأسطورية":"Legendary Fish Trophy","كأس سمكة ذهبية على قاعدة، قطعتان تركّبهما":"Golden fish trophy on a base, two pieces you assemble","تاج الانتصار":"Victory Crown","تاج الانتصار، ديكور أو هدية":"Victory crown, décor or gift","لوحة ميكي وميني الجدارية":"Mickey & Minnie Wall Panel","لوحة جدارية بنقش ستنسل، تُثبت بلاصق":"Stencil-pattern wall panel, mounts with adhesive","✦ تابعنا على انستقرام وتيك توك":"✦ Follow us on Instagram and TikTok","تابعنا على انستقرام أو تيك توك واحصل على خصم":"Follow us on Instagram or TikTok and get a discount","راسلنا على انستقرام أو تيك توك":"Message us on Instagram or TikTok","ننسخ رسالتك تلقائياً، الصقها في انستقرام أو تيك توك وأرسلها.":"We copy your message automatically — paste it in Instagram or TikTok and send.","📋 لما تضغط «أرسل الطلب بالخاص» ننسخ رسالة طلبك جاهزة، ونفتح لك محادثتنا في انستقرام أو تيك توك.":"📋 When you tap “Send the order by DM” we copy your ready order message and open our Instagram or TikTok chat.","افتح تيك توك":"Open TikTok","انستقرام":"Instagram","تيك توك":"TikTok","راسلنا عن طريق":"Message us on","تابعنا على":"Follow us on","(في تيك توك ادخل حسابنا واضغط":"(On TikTok open our profile and tap","رسالة":"Message","♡ أضف للمفضلة": "♡ Add to favourites", "♥ في المفضلة": "♥ In favourites", "🔗 شارك": "🔗 Share", "📋 انسخ الرابط": "📋 Copy link", "مفضلتي": "My favourites", "❤️ مفضلتي": "❤️ My favourites", "تم نسخ الرابط ✓": "Link copied ✓", "تعذّر النسخ": "Could not copy", "انضافت للمفضلة ♥": "Added to favourites ♥", "انحذفت من المفضلة": "Removed from favourites", "سجّل الدخول عشان تحفظ مفضلتك": "Sign in to save your favourites", "ما أضفت شي للمفضلة للحين. اضغط ♡ على أي قطعة تعجبك.": "No favourites yet. Tap ♡ on any piece you like.", "حرف باسمك": "Your Name Letter", "حرف مع اسمك وقلوب وزهرة، والاسم حسب طلبك": "Letter with your name, hearts and a flower. Name as you like", "(أو": "(or", "X — العرض": "X — Width", "Y — العمق (الطول)": "Y — Depth (length)", "Z — الارتفاع": "Z — Height", "، وأرسل لنا صورة تثبت متابعتك، وخذ خصم يحبه قلبك 💛": ", send us a screenshot showing you follow us, and get a discount you'll love 💛", "✦ تابعنا على انستقرام": "✦ Follow us on Instagram", "✦ متابعتك تفرق معنا، وخصمك جاهز بمجرد ما توصلنا صورة المتابعة 🎁": "✦ Your follow means a lot — your discount is ready as soon as we get your follow screenshot 🎁", "اللون الأساسي": "Original colour", "أبيض": "White", "أسود": "Black", "رمادي": "Grey", "أحمر": "Red", "برتقالي": "Orange", "أصفر": "Yellow", "أخضر": "Green", "أزرق": "Blue", "بنفسجي": "Purple", "وردي": "Pink", "ذهبي": "Gold", "أخرى": "Other", "أرسل الطلب بالخاص": "Send the order by DM", "أسفل الشاشة (أو أعلاها في الآيباد).": "at the bottom of the screen (or the top on iPad).", "أضف للطلب": "Add to order", "أو": "or", "أُضيفت للطلب ✓": "Added to order ✓", "إرسال وحفظ ومشاركة ← تثبيت الصفحة كتطبيق": "Cast, save and share → Install page as app", "إضافة": "Add", "إضافة إلى Dock": "Add to Dock", "إضافة إلى الشاشة الرئيسية": "Add to Home Screen", "إغلاق": "Close", "إكسسوار مكينة xBloom": "xBloom machine accessory", "إنقاص": "Decrease", "زيادة": "Increase", "اختر": "Choose", "اختر القسم، ثم القطعة واللون والعدد. سعر الجملة: 12 حبة من نفس القطعة إذا وزنها أقل من 100 غرام، و6 حبات إذا وزنها 100 غرام أو أكثر.": "Pick a section, then the piece, colour and quantity. Wholesale price: 12 pcs of the same piece if it weighs under 100 g, or 6 pcs if it weighs 100 g or more.", "اختر قطعتك، ونطبعها باللون اللي تحبه": "Pick your piece — we print it in the colour you love", "اسحب بإصبعك لتدوير القطعة، وقرّب بإصبعين": "Drag to rotate, pinch to zoom", "اضغط": "Tap", "اضغط القائمة": "Tap the menu", "اضغط زر المشاركة": "Tap the Share button", "اضغطها في أي وقت ويفتح لك المتجر مباشرة كتطبيق مستقل.": "Tap it any time and the store opens straight away as its own app.", "اعتمد هذا اللون": "Use this colour", "افتح هذا الرابط في": "Open this link in", "اكتب المقاس اللي تبيه بالمليمتر": "Type the size you want in millimetres", "اكتب طلبك، مثلاً: أبيها تعليقة، أو حجم أكبر، أو اسم عليها": "Write your request, e.g. add a hanger, a bigger size, or a name on it", "الأقسام": "Sections", "الارتفاع": "Height", "العرض": "Width", "العمق / الطول": "Depth / length", "البطات": "Ducks", "البطة الدرامية": "Drama Duck", "البطة الرايقة": "Chill Duck", "البطة الطايرة": "Flying Duck", "البطة الكيوت": "Cute Duck", "البطة المصدومة": "Shocked Duck", "بطة اليوغا": "Yoga Duck", "بطة بالهودي": "Hoodie Duck", "التحويل إلى السنتيمتر": "Converting to centimetres", "التطبيق مجاني وخفيف، ما يحتاج متجر تطبيقات ولا يطلب أي صلاحيات.": "The app is free and light — no app store needed and it asks for no permissions.", "التطبيقات ← تثبيت هذا الموقع كتطبيق": "Apps → Install this site as an app", "الحكماء الثلاثة": "Three Wise Monkeys", "الحكماء الثلاثة، بالأقنعة": "Three Wise Monkeys, masked", "الحكماء الثلاثة، تجريدي": "Three Wise Monkeys, abstract", "الرئيسية": "Home", "الصفارات": "Whistles", "الصفحة التالية": "Next page", "الصفحة السابقة": "Previous page", "الصور لقطع مطبوعة عندنا. اختر اللون وشوف القطعة تتلوّن قبل ما تطلب.": "Photos are of pieces we printed. Pick a colour and see the piece change before you order.", "العدد": "Quantity", "العميل ما يشوف هذا القسم": "Customers don't see this section", "اللون:": "Colour:", "المحور": "Axis", "المقاسات الأصلية": "Original size", "الوزن:": "Weight:", "الوزن: يُضاف قريباً": "Weight: coming soon", "يُضاف قريباً": "Coming soon", "انزل في القائمة واختر": "Scroll down the menu and choose", "انسخ الطلب فقط": "Just copy the order", "بالسنتيمتر": "In cm", "بالمليمتر": "In mm", "تابعنا على انستقرام واحصل على خصم": "Follow us on Instagram and get a discount", "تبي تحذفه؟ احذف الأيقونة مثل أي تطبيق.": "Want to remove it? Delete the icon like any app.", "تبي مقاس مختلف؟": "Want a different size?", "تثبيت": "Install", "تثبيت التطبيق": "Install app", "تصفح القطع": "Browse pieces", "تطبيق RAX3D": "RAX3D app", "تعديل المقاس": "Change size", "تعليقة سيارة أو ديكور طبلون": "Car hanger or dashboard décor", "تم تحميل التطبيق": "App installed", "تمام": "OK", "جاري تحميل المجسم…": "Loading the model…", "حافظ على النسبة": "Keep proportions", "حامل البرينجلز مع صينية": "Pringles holder with tray", "حامل علبة الشيبس": "Chips can holder", "حامل مع صينية، بشعار البرينجلز": "Holder with tray, with the Pringles logo", "حامل مع صينية، والعبارة حسب طلبك": "Holder with tray, text of your choice", "حذف": "Remove", "حمّل التطبيق": "Get the app", "حمّل تطبيق RAX3D على جهازك": "Get the RAX3D app on your device", "ديكور": "Décor", "ديكور مكتب أو رف": "Desk or shelf décor", "راسلنا على انستقرام": "Message us on Instagram", "رجّع المقاس الأصلي": "Reset to original size", "ركن القهوة": "Coffee corner", "ستاند xBloom بـ 7 فتحات": "xBloom 7-slot stand", "سعر الجملة مفعّل لهذه القطعة ✓": "Wholesale price applied to this piece ✓", "سناك": "Snacks", "شعار RAX3D": "RAX3D logo", "شوفها بلونك": "See it in your colour", "شوفها ثلاثي الأبعاد بلونك": "See it in 3D in your colour", "صحن صغير للشيبس": "Small chips dish", "صحون الشيبس": "Chips dishes", "صفارة": "Whistle", "صفارة البط": "Duck whistle", "صفارة الجبن": "Cheese whistle", "صفارة الجمجمة": "Skull whistle", "صفارة العصفور": "Bird whistle", "صفارة الناي": "Flute whistle", "صفارة بصوت البط": "Whistle that sounds like a duck", "صفارة بصوت العصفور": "Whistle that sounds like a bird", "صفارة بصوت قوي": "Loud whistle", "صفارة متعددة النغمات": "Multi-tone whistle", "طلبي": "My order", "غرام": "g", "فوق على اليمين.": "at the top right.", "في أعلى المتصفح (أو أيقونة التثبيت": "at the top of the browser (or the install icon", "في أعلى المتصفح.": "at the top of the browser.", "في الآيفون)، وارجع لهذا الزر.": "on iPhone), then come back to this button.", "في طرف شريط العنوان).": "at the end of the address bar).", "قاعدة جوال xBloom": "xBloom phone base", "قاعدة علبة الطحن xBloom": "xBloom grinder cup base", "قاعدة فلاتر xBloom": "xBloom filter base", "هوبر xBloom": "xBloom hopper", "كل 10 مم = 1 سم. مثال لقطعة مقاسها 106 × 102 × 45 مم:": "Every 10 mm = 1 cm. Example for a piece measuring 106 × 102 × 45 mm:", "كل القطع": "All pieces", "وبهذا الشعار:": "with this logo:", "للتأكيد.": "to confirm.", "للمالك فقط": "Owner only", "ما أضفت قطع بعد.": "You haven't added any pieces yet.", "ما انرفع ملف طباعة لهذي القطعة بعد.": "No print file uploaded for this piece yet.", "متصفحك الحالي ما يدعم تثبيت التطبيقات.": "Your current browser doesn't support installing apps.", "مزهرية حلزونية": "Spiral vase", "مزهرية ديكور للورد الصناعي أو المجفف": "Décor vase for artificial or dried flowers", "مشاركة": "Share", "ملف": "File", "مم": "mm", "مم ← سم؟": "mm → cm?", "من شريط القوائم فوق اختر": "From the menu bar at the top choose", "ميداليات": "Keychains", "ميدالية أو تعليقة شنطة": "Keychain or bag charm", "ميدالية أو ديكور مكتب": "Keychain or desk décor", "ميدالية مفاتيح": "Keychain", "ميدالية مفاتيح وستاند جوال": "Keychain and phone stand", "ميدالية مكينة القهوة": "Coffee machine keychain", "ميدالية وستاند جوال، إطار": "Keychain & phone stand, frame", "ميدالية وستاند جوال، ثلاثي": "Keychain & phone stand, triple", "ميدالية وستاند جوال، مدمج": "Keychain & phone stand, compact", "نفتح لك محادثتنا في انستقرام وننسخ طلبك تلقائياً، الصقه في الرسالة وأرسله، ونأكد لك طلبك وموعد التجهيز.": "We open our Instagram chat and copy your order automatically — paste it into the message, send it, and we'll confirm your order and ready date.", "هيكل عظمي": "Skeleton", "وقت الطباعة وإعدادات P2S وملف 3MF داخل برنامج الفواتير، ويطلب رمزك.": "Print time, P2S settings and the 3MF file are in the invoicing app, behind your PIN.", "🖨️ فتح ملف الطباعة": "🖨️ Open print file", "أنت فاتح التطبيق حالياً ✓": "You're already using the app ✓", "ثبّت التطبيق الحين": "Install the app now", "جهازك يعرض عليك نافذة صغيرة، اضغط فيها «تثبيت».": "Your device will show a small window — tap “Install” in it.", "تم النسخ، الصقه في الخاص": "Copied — paste it in the DM", "ما قدرنا نحمّل المجسم، جرّب مرة ثانية.": "We couldn't load the model, please try again.", "أقصى مقاس نقدر نطبعه: 255 × 255 × 255 مم (25.5 سم لكل محور).": "The largest size we can print: 255 × 255 × 255 mm (25.5 cm per axis).", "جملة": "Wholesale", "RAX3D | اطلب قطعتك": "RAX3D | Order your piece", "حسابي": "My account", "سجّل باسمك وجوالك بدون رقم سري، ويوصلنا طلبك جاهز باسمك. وكل ريال تشتري فيه يعطيك نقطة ولاء ⭐": "Sign in with your name and mobile — no password. Your order reaches us ready under your name, and every riyal you spend earns you a loyalty point ⭐", "الاسم": "Name", "رقم الجوال": "Mobile number", "حفظ": "Save", "تسجيل الخروج": "Sign out", "بياناتك محفوظة في جهازك فقط، وتنرسل لنا مع طلبك بس.": "Your details stay on your device and are only sent to us with your order.", "سجّل واكسب نقاط": "Sign in & earn points", "الطلب باسم": "Order for", "تعديل": "Edit", "⭐ تنضاف لك نقطة ولاء على كل ريال في هذا الطلب": "⭐ You earn a loyalty point for every riyal of this order", "سجّل واكسب نقاط ولاء ⭐": "Sign in & earn loyalty points ⭐", "اسمك وجوالك بس، بدون رقم سري. كل ريال = نقطة، ويوصلنا طلبك جاهز باسمك.": "Just your name and mobile, no password. 1 riyal = 1 point, and your order reaches us ready under your name.", "سجّل الحين": "Sign in now", "اكتب اسمك.": "Please enter your name.", "اكتب رقم جوال سعودي صحيح يبدأ بـ 05 (10 أرقام).": "Enter a valid Saudi mobile starting with 05 (10 digits).", "مزهرية الموجة": "Wave vase", "مزهرية طويلة للورد الصناعي أو المجفف": "Tall vase for artificial or dried flowers", "مزهرية الأضلاع": "Ribbed vase", "مصباح اللولب": "Spiral lamp", "مصباح الرجل الصغير": "Little man lamp", "مصباح طاولة على شكل رجل جالس بغطاء أسود، مع إضاءة LED": "Table lamp shaped like a seated little man with a black shade, with LED lighting", "مصباح المكعبات": "Cube lamp", "مصباح المكعبات (تصميم A)": "Cube lamp (Design A)", "مصباح المكعبات (تصميم B)": "Cube lamp (Design B)", "مصباح طاولة من مكعبات معلّقة، مع إضاءة LED": "Floating-cubes table lamp, with LED lighting", "نوع التصميم": "Design type", "🚚 اطلب مع التوصيل (+25 ريال) · نتواصل بالخاص": "🚚 Order with delivery (+25 SAR) · we arrange it privately", "هل يوجد توصيل؟": "Is delivery available?", "الدفع أونلاين يشمل التوصيل برسوم 25 ريال. والدفع عند الاستلام استلام مباشر بدون رسوم. وإن أردت التوصيل مع الطلب بالخاص فاختر «أبغى توصيل» قبل «أرسل الطلب بالخاص»، ونتفق معك على الموقع والموعد.": "Online payment includes delivery for a 25 SAR fee. Cash on delivery is a direct handover with no fee. If you want delivery with a private order, tick “I want delivery” before “Send the order by DM”, and we agree the location and time with you.", "تصميم A": "Design A", "تصميم B": "Design B", "مكعب · 135 مم": "Cube · 135 mm", "برج · 216 مم": "Tower · 216 mm", "مصباح طاولة بتصميم لولبي، مع إضاءة LED": "Spiral-design table lamp, with LED lighting", "مزهرية صغيرة لوردة أو ورد مجفف": "Small vase for a single or dried flower", "بني": "Brown", "إكسسوارات السيارة": "Car accessories", "إكسسوارات القهوة": "Coffee accessories", "إكسسوارات المكتب": "Office accessories", "الديكور": "Décor", "الإضاءات": "Lighting", "سناك وضيافة": "Snacks & serving", "ألعاب وصفارات": "Toys & whistles", "قطع مميزة بطباعة ثلاثية الأبعاد": "Unique pieces, 3D printed", "اختر القطعة واللون والمقاس، ونطبعها لك عند الطلب.": "Choose the piece, colour and size — we print it to order.", "تسوّق الآن": "Shop now", "تعذّر التحقق الأمني. جرّب مرة ثانية أو أرسل الطلب بالخاص.": "The security check failed. Try again or send the order by DM.", "ما تم التحقق الأمني. جرّب مرة ثانية أو أرسل الطلب بالخاص.": "The security check was not accepted. Try again or send the order by DM.", "💡 تقدر تغيّر الأجزاء أو الكتابات بلون مختلف: اذكر ذلك في خانة «تفاصيل إضافية قبل الطباعة» تحت.":"💡 You can change parts or lettering to a different colour: mention it in the \"Extra details before printing\" box below.", "الطلبات الكبيرة (أكثر من 500 حبة في السطر الواحد أو أكثر من 40 سطرًا) نرتبها معك بالخاص، استخدم «أرسل الطلب بالخاص» تحت.": "Large orders (over 500 pieces on one line or more than 40 lines) are arranged with you by DM: use “Send the order by DM” below.", "السلة وصلت الحد الأقصى 40 سطرًا، أرسل الطلب بالخاص": "The order is at its 40-line limit, send it by DM", "المفضلة": "Favourites", "تحت. (في تيك توك ادخل حسابنا واضغط": "below. (On TikTok open our profile and tap", "🧊 شوفها 3D واختر اللون وأضفها للطلب": "🧊 View in 3D, pick a colour and add to order", "🎨 اختر اللون والمقاس وأضفها للطلب": "🎨 Pick colour and size, then add to order", "افتح المعاينة": "Open the preview", "اختر اللون والمقاس": "Choose colour and size", "اضغط «اعتمد وأضف للطلب»": "Tap “Confirm and add to order”", "خطوات الإضافة للطلب": "Steps to add to your order", "طريقة الاستلام (إلزامي)": "Handover method (required)", "🚚 توصيل": "🚚 Delivery", "🏪 استلام مباشر": "🏪 Direct pickup", "مجاني، نتفق معك على المكان والموعد": "free; we agree the place and time with you", "اختر طريقة الاستلام: توصيل أو استلام مباشر.": "Choose how you get it: delivery or direct pickup.", "اطلب والدفع عند الاستلام (استلام مباشر)": "Order and pay on pickup (direct handover)", "الدفع عند الاستلام": "Cash on pickup", ". وصلنا طلبك وبنتواصل معك لتأكيد التجهيز والتسليم.": ". We got your order and will contact you to confirm preparation and handover.", "رقم الطلب": "Order number", "التوصيل": "Delivery", "الإجمالي": "Total", "الحالة": "Status", "مدفوع ✓": "Paid ✓", "مدة التجهيز": "Preparation time", "حسب الطلب والعدد (نتواصل معك بالخاص)": "depends on the order and quantity (we contact you by message)", "من 3 إلى 7 أيام": "3 to 7 days", "📋 انسخ تفاصيل الطلب": "📋 Copy order details", "احفظ رقم الطلب أو خذ لقطة شاشة، تحتاجه للمتابعة.": "Keep the order number or take a screenshot; you need it to track your order.", "تم نسخ تفاصيل الطلب": "Order details copied", "سجّل واكسب نقاط ولاء على كل طلب ⭐": "Sign up and earn loyalty points on every order ⭐", "التجهيز: من 3 إلى 7 أيام": "ready in 3 to 7 days", "الجملة: المدة حسب الطلب والعدد ونتواصل معك بالخاص": "wholesale: time depends on the order and quantity, we contact you by message", "⏱ مدة التجهيز: من 3 إلى 7 أيام": "⏱ Preparation time: 3 to 7 days", "⏱ مدة تجهيز طلب الجملة: حسب الطلب والعدد، ونتواصل معك بالخاص لتحديدها": "⏱ Wholesale preparation time: depends on the order and quantity; we contact you by message to agree it", "لون تختار منها": "colours to choose", "شوف القطعة قبل الطلب": "see it before you order", "نقطة ولاء على كل ريال": "loyalty point per riyal", "الأكثر طلباً": "Most popular", "تسوّق حسب الاستخدام": "Shop by use", "وصل حديثاً": "New arrivals", "كيف أطلب؟": "How to order?", "اختر القطعة": "Pick the piece", "واللون والمقاس والعدد، وأضفها لطلبك.": "its colour, size and quantity, and add it to your order.", "ننسخ رسالتك تلقائياً، الصقها في انستقرام أو تيك توك وأرسلها.": "We copy your message automatically — paste it in Instagram and send.", "نأكد طلبك": "We confirm your order", "نرد عليك بتأكيد الطلب وموعد التجهيز، والدفع بعد الاتفاق.": "We reply to confirm your order and ready date; you pay once we agree.", "نطبع ونسلّم": "We print & deliver", "تتابع طلبك بكود الطلب في أي وقت.": "Track your order any time with your order code.", "سعر الجملة: 12 حبة من نفس القطعة إذا وزنها أقل من 100 غرام، و6 حبات إذا وزنها 100 غرام أو أكثر.": "Wholesale price: 12 pcs of the same piece if it weighs under 100 g, or 6 pcs if 100 g or more.", "الأسئلة الشائعة": "FAQ", "الاستبدال والاسترجاع": "Returns & exchanges", "سياسة الخصوصية": "Privacy policy", "متابعة الطلب": "Track your order", "تواصل معنا": "Contact us", "RAX3D · طباعة ثلاثية الأبعاد · السعودية": "RAX3D · 3D printing · Saudi Arabia", "وثيقة العمل الحر:": "Freelance licence:", "🧊 اضغط": "🧊 Tap", "فوق الصورة، وغيّر اللون من الألوان تحت، ولفّ القطعة بإصبعك وشوفها من كل جهة.": "on the photo, change the colour below, and spin the piece with your finger to see every side.", "📋 لما تضغط «أرسل الطلب بالخاص» ننسخ رسالة طلبك جاهزة، ونفتح لك محادثتنا في انستقرام.": "📋 When you tap “Send the order by DM” we copy your ready order message and open our Instagram chat.", "الصقها في خانة الكتابة وأرسلها": "Paste it in the message box and send it", "، ونأكد لك طلبك وموعد التجهيز.": ", and we'll confirm your order and ready date.", "تم نسخ طلبك ✓": "Your order is copied ✓", "افتح انستقرام": "Open Instagram", "تحت.": "below.", "في المحادثة اضغط مطولاً على خانة الكتابة واختر": "In the chat, long-press the message box and choose", "لصق": "Paste", "إرسال": "Send", "كود طلبك:": "Your order code:", "— احتفظ فيه لمتابعة طلبك.": "— keep it to track your order.", "🧊 خصّصها وشوفها ثلاثية الأبعاد": "🧊 Customise it & see it in 3D", "🎨 اختر اللون والمقاس والعدد": "🎨 Choose colour, size & quantity", "ملخص اختيارك": "Your choice", "اعتمد وأضف للطلب": "Confirm & add to order", "🧊 لفّ القطعة بإصبعك وشوفها من كل جهة، واختر اللون من تحت ويتغير عليها مباشرة.": "🧊 Spin the piece with your finger to see every side, and pick a colour below — it changes instantly. 📷 takes you back to the photo.", "🎨 اختر اللون من تحت ويتغير على الصورة مباشرة.": "🎨 Pick a colour below and the photo changes instantly.", "تتابع طلبك برقم الطلب اللي في فاتورتك.": "Track your order with the order number on your invoice.", "بعد ما نتفق معك على السعر توصلك الفاتورة، وفيها": "Once we agree on the price you get your invoice, with your", "رقم طلبك": "order number", "مثل": "like", "لمتابعة طلبك.": "to track your order."};
ITEMS.forEach(i=>{const d=dsc(i);if(d&&DESC_EN[lead(i).id])EN[d]=DESC_EN[lead(i).id]});
Object.values(PN).flat().forEach(x=>{if(!EN[x[0]])EN[x[0]]=x[1]});
const MNE={"الكرة":"Ball","الجسم":"Body","القاعدة":"Base","الهودي":"Hoodie","الحرف":"Letter","الخلفية":"Background","الحامل":"Holder","اللوحة":"Board"};Object.entries(MNE).forEach(([a,b])=>{if(!EN[a])EN[a]=b});
const WH={"على الشاشة الرئيسية لجوالك":"on your phone's home screen","في الـ Dock وفي مجلد التطبيقات":"in the Dock and the Applications folder","على سطح المكتب وفي قائمة ابدأ":"on the desktop and in the Start menu","بين تطبيقات جهازك":"among your device's apps"};
const tw=s=>WH[s]||s;
const RX=[
 [/^ألوان متعددة \((.+)\)$/,(m,a)=>"Multiple colours ("+a.split("، ").map(tr).join(", ")+")"],
 [/^🎨 طلب خاص — ألوان مختلفة: ([^|]+?)( \| .*)?$/,(m,a,b)=>"🎨 Special order — mixed colours: "+a.split("، ").map(tr).join(", ")+(b||"")],
 [/^أُضيفت لنفس القطعة في طلبك: الكمية الآن (\d+)( ✓ سعر الجملة)?$/,(m,a,c)=>"Added to the same piece in your order: quantity is now "+a+(c?" ✓ wholesale price":"")],
 [/^رسوم (\d+) ريال$/,"$1 SAR fee"],
 [/^المجموع قبل التوصيل: (\d+) ريال$/,"Subtotal before delivery: $1 SAR"],
 [/^(.*) \(استلام مباشر\)$/,(m,a)=>tr(a)+" (direct pickup)"],
 [/^الدفع أونلاين: تختار عند الدفع بين التوصيل \(\+(\d+) ريال\) والاستلام المباشر \(بدون رسوم\)\.( الدفع عند الاستلام استلام مباشر أيضًا\.)?$/,(m,a,c)=>"Online payment: at checkout you choose delivery (+"+a+" SAR) or direct pickup (no fee)."+(c?" Cash on delivery is also a direct pickup.":"")],
 [/^🚚 أبغى توصيل \(\+(\d+) ريال\)$/,"🚚 I want delivery (+$1 SAR)"],
 [/^الدفع أونلاين يشمل رسوم التوصيل (\d+) ريال، فيكون المطلوب (\d+) ريال\.( الدفع عند الاستلام استلام مباشر بدون رسوم توصيل\.)?$/,(m,a,b,c)=>"Online payment includes the "+a+" SAR delivery fee, so the amount due is "+b+" SAR."+(c?" Cash on delivery is a direct handover with no delivery fee.":"")],
 [/^(.+) × (\d+)$/,(m,a,b)=>tr(a)+" × "+b],   /* receipt line: piece name × quantity */
 [/^🚚 التوصيل: ([\d.]+) ريال · (.+)$/,(m,a,b)=>"🚚 Delivery: "+a+" SAR · "+b.split(" · ").map(tr).join(" · ")],   /* must stay above the generic "label: value" pattern */
 [/^(.+) · غطاء: (.+)$/,(m,a,b)=>tr(a)+" · shade: "+tr(b)],
 [/^\+ رسوم التوصيل (\d+) ريال عند الدفع أونلاين أو عند الاستلام، فيكون المطلوب (\d+) ريال\.$/,(m,a,b)=>"+ delivery fee "+a+" SAR for online payment or cash on delivery, so the amount due is "+b+" SAR."],
 [/^(.*) \(يشمل التوصيل (\d+)\)$/,(m,a,b)=>tr(a)+" (incl. delivery "+b+" SAR)"],
 [/^الإجمالي عند الاستلام: (\d+) ريال(.*)$/,(m,a,r)=>"Total on pickup: "+a+" SAR"+(r?" "+r:"")],[/^رقم طلبك ORD-(\d+)$/,(m,a)=>"Your order number ORD-"+a],
 [/^([\d.]+) مم$/,(m,a)=>a+" mm"],[/^([\d.]+) سم$/,(m,a)=>a+" cm"],[/^(\d+) قطع$/,(m,a)=>a+" pieces"],
 [/^القسم: (.+)$/,(m,a)=>"Section: "+tr(a)],[/^المقاس الجديد: (.+) مم$/,(m,a)=>"New size: "+a+" mm"],
 [/^سعر الجملة من (\d+) حبة من نفس القطعة \(باقي (\d+)\)$/,(m,a,b)=>"Wholesale price from "+a+" pcs of the same piece ("+b+" to go)"],
 [/^أقصى مقاس (\d+) مم لكل محور، عدّل الرقم\.$/,(m,a)=>"Max size is "+a+" mm per axis — please adjust."],
 [/^أقصى مقاس لكل محور (\d+) مم\.$/,(m,a)=>"Max size per axis: "+a+" mm."],
 [/^عدّل المقاس: كل محور من 1 إلى (\d+) مم\.$/,(m,a)=>"Fix the size: each axis 1 to "+a+" mm."],
 [/^(.+) \(مم\)$/,(m,a)=>tr(a)+" (mm)"],
 [/^نضيف لك تطبيق RAX3D (.+) بثلاث خطوات:$/,(m,a)=>"Add the RAX3D app "+tw(a)+" in 3 steps:"],
 [/^لقيته (.+) باسم$/,(m,a)=>"You'll find it "+tw(a)+" named"],
 [/^جهازك أضاف أيقونة التطبيق (.+)\.$/,(m,a)=>"Your device added the app icon "+tw(a)+"."],
 [/^بضغطة وحدة نثبت لك تطبيق RAX3D (.+)، ويفتح مثل أي برنامج بدون متصفح\.$/,(m,a)=>"One tap installs the RAX3D app "+tw(a)+" — it opens like any program, no browser."],
 [/^أهلاً (.+)، تم التسجيل ✓$/,(m,a)=>"Welcome "+a+", you're signed in ✓"],[/^👤 سجّل واكسب نقاط$/,()=>"👤 Sign in & earn points"],
 [/^([^—]+?) غير متوفر حالياً$/,(m,a)=>tr(a)+" is out of stock right now"],[/^(.+) — غير متوفر حالياً$/,(m,a)=>tr(a)+" — out of stock"],
 [/^السعر: (\d+) ريال$/,(m,a)=>"Price: "+a+" SAR"],[/^الجملة: (\d+) ريال للحبة من (\d+) حبة$/,(m,a,b)=>"Wholesale: "+a+" SAR each from "+b+" pcs"],[/^الإجمالي: (\d+) ريال( \(للمقاس الأصلي\))?$/,(m,a,b)=>"Total: "+a+" SAR"+(b?" (original size)":"")],[/^(\d+) ريال$/,(m,a)=>a+" SAR"],[/^السعر بالخاص$/,()=>"Price on request (DM)"],
 [/^خصّص: (.+)$/,(m,a)=>"Customise: "+tr(a)],[/^متوفرة بـ (\d+) لون، وتقدر تعدّل مقاسها حتى (\d+) مم\.$/,(m,a,b)=>"Available in "+a+" colours, and you can resize it up to "+b+" mm."],
 [/^اللون: (.+) · المقاس: (.+) · العدد: (\d+)( \(جملة\))?$/,(m,a,b,c,d)=>"Colour: "+tr(a)+" · Size: "+b.replace("مم (الأصلي)","mm (original)").replace("مم","mm").replace("المقاس الأصلي","Original")+" · Qty: "+c+(d?" (wholesale)":"")],
 [/^(\d+) حبة$/,(m,a)=>a+" pcs"],[/^مقاس (.+)$/,(m,a)=>"Size "+a],[/^(.{2,20}): (.+)$/,(m,a,b)=>PNAMES.includes(a)||/^الجزء \d+$/.test(a)?(EN[a]||a.replace("الجزء ","Part "))+": "+tr(b):m]
];
let LANG="ar";try{LANG=localStorage.getItem("rax3d_lang")==="en"?"en":"ar"}catch(_){}
function tr(s){if(LANG!=="en"||!s||!/[\u0600-\u06FF]/.test(s))return s;const k=s.trim();if(EN[k]!=null)return s.replace(k,EN[k]);
 for(const [r,f] of RX){if(r.test(k))return s.replace(k,k.replace(r,f))}   /* whole-line patterns first, so "colour · size · qty" summaries are not split apart */
 if(k.includes(" · "))return s.replace(k,k.split(" · ").map(tr).join(" · "));return s}
const ATTR=["aria-label","placeholder","alt","title"];
function trNode(root){if(LANG!=="en")return;
 if(root.nodeType===3){const v=tr(root.nodeValue);if(v!==root.nodeValue)root.nodeValue=v;return}
 if(root.nodeType!==1)return;
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;const ns=[];while(n=w.nextNode())ns.push(n);
 ns.forEach(n=>{const v=tr(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v});
 [root,...root.querySelectorAll("*")].forEach(e=>{if(e.getAttribute("dir")==="rtl")e.setAttribute("dir","ltr");
  ATTR.forEach(a=>{const v=e.getAttribute&&e.getAttribute(a);if(v){const x=tr(v);if(x!==v)e.setAttribute(a,x)}})})}
const MO=new MutationObserver(ms=>{if(LANG!=="en")return;MO.disconnect();
 ms.forEach(m=>{if(m.type==="characterData")trNode(m.target);else m.addedNodes.forEach(trNode)});
 MO.observe(document.body,{childList:true,subtree:true,characterData:true})});
function applyLang(){const en=LANG==="en";document.documentElement.lang=en?"en":"ar";document.documentElement.dir=en?"ltr":"rtl";
 if(typeof render==="function"&&typeof hist!=="undefined"&&hist[hi]){seoFor(hist[hi].v==="item"||hist[hi].v==="edit"?hist[hi].id:null)}else document.title=en?"RAX3D | Order your piece":"RAX3D | متجر طباعة ثلاثية الأبعاد في السعودية";
 const b=$("#langBtn");b.textContent=en?"ع":"EN";b.setAttribute("aria-label",en?"العربية":"English");
 if(en){trNode(document.body);MO.observe(document.body,{childList:true,subtree:true,characterData:true})}}
$("#langBtn").onclick=()=>{LANG=LANG==="en"?"ar":"en";try{localStorage.setItem("rax3d_lang",LANG)}catch(_){}
 if(LANG==="ar"){location.reload();return}applyLang();render(false)};
/* lock page scroll while a dialog is open (stops the page sliding behind the 3D viewer on phones) */
(()=>{const ids=["mbg","ibg","abg","pbg","rbg","cbg","sbg","paybg","codbg"];let y=0,locked=false;
 const sync=()=>{const open=ids.some(i=>{const e=document.getElementById(i);return e&&!e.hidden});if(open===locked)return;locked=open;
  const b=document.body;if(window.LENIS)open?LENIS.stop():LENIS.start();if(open){y=scrollY;b.style.position="fixed";b.style.top=-y+"px";b.style.left="0";b.style.right="0";b.style.overflow="hidden"}
  else{b.style.position=b.style.top=b.style.left=b.style.right=b.style.overflow="";scrollTo(0,y)}};
 const mo=new MutationObserver(sync);ids.forEach(i=>{const e=document.getElementById(i);if(e)mo.observe(e,{attributes:true,attributeFilter:["hidden"]})})})();
try{const pid=new URLSearchParams(location.search).get("p");if(pid&&ITEMS.some(i=>i.id===pid)){hist=[{v:"home"},{v:"item",id:pid}];hi=1}}catch(_){}
/* ---- motion: GSAP + ScrollTrigger + Lenis (skipped for reduced-motion or if libs fail to load) ---- */
(()=>{
 const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
 if(reduce||!window.gsap||!window.ScrollTrigger)return;
 gsap.registerPlugin(ScrollTrigger);
 if(window.Lenis){try{
  const L=new Lenis({autoRaf:false,lerp:.12,wheelMultiplier:1,allowNestedScroll:true,
   prevent:n=>!!(n.closest&&n.closest("canvas,.v3d,.rail,[hidden],[data-lenis-prevent]"))});
  L.on("scroll",ScrollTrigger.update);
  gsap.ticker.add(t=>L.raf(t*1000));gsap.ticker.lagSmoothing(0);
  window.LENIS=L;}catch(_){}}
 const E="power3.out",CLR="transform,opacity,visibility";
 window.motionView=()=>{
  ScrollTrigger.getAll().forEach(t=>t.kill());
  const m=document.getElementById("main");if(!m)return;
  const hero=m.querySelectorAll(".hero > *");
  if(hero.length)gsap.from(hero,{y:18,autoAlpha:0,duration:.6,ease:E,stagger:.07,clearProps:CLR});
  const pic=m.querySelector(".pic img");
  if(pic)gsap.from(pic,{scale:1.06,autoAlpha:0,duration:.7,ease:E,clearProps:CLR});
  const hd=m.querySelectorAll(".hd,.acts,.sechd");
  if(hd.length)gsap.from(hd,{y:12,autoAlpha:0,duration:.45,ease:E,stagger:.06,delay:.1,clearProps:CLR});
  const els=m.querySelectorAll(".grid .item,.cats .cat,.how li");
  if(els.length){gsap.set(els,{y:22,autoAlpha:0});
   ScrollTrigger.batch(els,{start:"top 92%",once:true,
    onEnter:b=>gsap.to(b,{y:0,autoAlpha:1,duration:.55,ease:E,stagger:.06,overwrite:true,clearProps:CLR})});}
  ScrollTrigger.refresh();
 };
})();
/* ---------- online payment (Moyasar). Hidden until PAY.pk and PAY.api are filled in.
   The amount the customer pays is re-checked by the worker in /worker (secret key stays there). ---------- */
const PAY={pk:"pk_live_VwRA9r6iBwKYbBg2ZvGd9HdrX5pG8cJSeGXhVadE",gate:false,api:"https://rax3d-pay.rax3d.workers.dev",ship:0,methods:["creditcard","applepay"]}; /* add "applepay" / "stcpay" only after Moyasar has activated them for the account */
/* a pk_test_ key is only live for whoever opens the site with ?paytest, so customers never see test mode */
const PTEST=(()=>{try{if(/[?&]paytest\b/.test(location.search))sessionStorage.setItem("rax3d_ptest","1");return sessionStorage.getItem("rax3d_ptest")==="1"}catch(_){return false}})();
const withinLimits=()=>cart.length<=40&&cart.every(o=>o.qty<=500);   /* the worker records at most 40 lines and 500 pieces per line: bigger orders go by DM (paying online for them would charge the customer and then be refused) */
const payable=()=>!!(PAY.pk&&PAY.api&&withinLimits()&&((!PAY.pk.startsWith("pk_test_")&&!PAY.gate)||PTEST)&&cart.length&&cart.every(o=>UP(o.id,o.qty)&&!o.size&&!o.note));
/* the delivery fee comes from the worker so the site and the amount the worker checks can never disagree (no answer = no fee) */
const CFGP=fetch(PAY.api+"/config",{cache:"no-store"}).then(r=>r.json()).then(j=>{if(j&&j.ok&&Number.isFinite(+j.ship)&&+j.ship>=0&&+j.ship<=200){PAY.ship=+j.ship;if(j.codShip!=null&&Number.isFinite(+j.codShip)&&+j.codShip>=0&&+j.codShip<=200)PAY.codShip=+j.codShip;PAY.modes=j.modes===true;if(typeof j.turnstile==="string"&&/^[0-9A-Za-z_-]{10,64}$/.test(j.turnstile))PAY.ts=j.turnstile;if(hist[hi]&&hist[hi].v==="cart")render(false)}}).catch(()=>{});
let PMODE="";   /* online payment: "delivery" | "pickup", chosen in the payment window once the worker announces modes (otherwise the old rule: delivery fee always) */
const payFee=()=>PAY.modes&&PMODE==="pickup"?0:PAY.ship;
const payTotal=()=>cart.reduce((a,o)=>a+LT(o),0)+payFee();
function payTotUI(){const sub=cart.reduce((a,o)=>a+LT(o),0);$("#paytot").textContent=PAY.modes&&!PMODE?`المجموع قبل التوصيل: ${sub} ريال`:`الإجمالي: ${payTotal()} ريال`+(payFee()?` (يشمل التوصيل ${payFee()})`:(PAY.modes?" (استلام مباشر)":""))}
document.addEventListener("change",e=>{if(e.target&&e.target.name==="payMode"){PMODE=e.target.value;payTotUI();payMsg("")}});
const codFee=()=>PAY.codShip==null?PAY.ship:PAY.codShip;   /* cash on delivery = direct handover: the worker says whether it carries a fee */
const codTotal=()=>cart.reduce((a,o)=>a+LT(o),0)+codFee();
function payLoad(){return new Promise((ok,no)=>{if(window.Moyasar)return ok();
 const l=document.createElement("link");l.rel="stylesheet";l.href="lib/moyasar.css";document.head.appendChild(l);
 const sc=document.createElement("script");sc.src="lib/moyasar.umd.js";sc.onload=ok;sc.onerror=no;document.head.appendChild(sc)})}
/* receipt shown after a successful order: the customer gets no message from us, so this is what they keep (copy or screenshot) */
function receiptHtml(num,lines,ship,paid){
 const sub=lines.reduce((a,l)=>a+l.u*l.q,0),w=lines.some(l=>l.q>=WQ(l.id)),prep=w?"حسب الطلب والعدد (نتواصل معك بالخاص)":"من 3 إلى 7 أيام";
 window.RCPT=["RAX3D · ORD-"+num,...lines.map(l=>`${l.n} × ${l.q} = ${l.u*l.q} ريال`),ship?`التوصيل: ${ship} ريال`:"",`الإجمالي: ${sub+ship} ريال`,paid?"مدفوع":"الدفع عند الاستلام","مدة التجهيز: "+prep,"rax3d.com"].filter(Boolean).join("\n");
 return `<div class="rcpt"><div class="rrow"><span>رقم الطلب</span><b dir="ltr">ORD-${num}</b></div>${lines.map(l=>`<div class="rrow"><span>${esc(l.n)} × ${l.q}</span><b>${SAR(l.u*l.q)}</b></div>`).join("")}${ship?`<div class="rrow"><span>التوصيل</span><b>${SAR(ship)}</b></div>`:""}<div class="rrow tot"><span>الإجمالي</span><b>${SAR(sub+ship)}</b></div><div class="rrow"><span>الحالة</span><b>${paid?"مدفوع ✓":"الدفع عند الاستلام"}</b></div><div class="rrow"><span>مدة التجهيز</span><b>${prep}</b></div></div><button type="button" class="btn alt" id="rcptCopy">📋 انسخ تفاصيل الطلب</button><p class="inote">احفظ رقم الطلب أو خذ لقطة شاشة، تحتاجه للمتابعة.</p>`}
const rcptLines=c=>(Array.isArray(c)?c:[]).filter(o=>o&&PRICE[o.id]&&o.qty>0).map(o=>({id:o.id,n:String(o.name||(ITEMS.find(i=>i.id===o.id)||{}).name||o.id),q:+o.qty,u:UP(o.id,+o.qty)}));
document.addEventListener("click",e=>{if(e.target.closest("#rcptCopy")&&window.RCPT)copyText(window.RCPT).then(()=>toastMsg("تم نسخ تفاصيل الطلب"))});
/* ---- Cloudflare Turnstile bot check: used only when the worker reports a site key in /config (nothing changes otherwise).
   It is invisible unless the visitor looks suspicious, in which case a small box appears at the bottom of the screen. ---- */
let TSW=null,TSP=null,TSRES=null,TSREJ=null,TSQ=Promise.resolve();
function tsLoad(){return TSP||(TSP=new Promise((ok,no)=>{const s=document.createElement("script");s.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";s.async=true;s.onload=()=>ok();s.onerror=()=>{TSP=null;no(new Error("ts-load"))};document.head.appendChild(s)}))}
function tsOnce(){return tsLoad().then(()=>new Promise((ok,no)=>{
 const t=setTimeout(()=>{TSRES=TSREJ=null;no(new Error("ts-timeout"))},15000);
 TSRES=tok=>{clearTimeout(t);TSRES=TSREJ=null;ok(tok)};TSREJ=e=>{clearTimeout(t);TSRES=TSREJ=null;no(e)};
 try{if(TSW===null)TSW=turnstile.render($("#tsBox"),{sitekey:PAY.ts,appearance:"interaction-only",callback:tok=>TSRES&&TSRES(tok),"error-callback":()=>TSREJ&&TSREJ(new Error("ts-error"))});else turnstile.reset(TSW)}catch(e){TSREJ&&TSREJ(e)}}))}
function tsToken(){if(!PAY.ts)return Promise.resolve(null);const p=TSQ.then(tsOnce,tsOnce);TSQ=p.catch(()=>{});return p}   /* one token per request, one at a time */
function payMsg(t,err){const m=$("#paymsg");m.textContent=t;m.className="dmsg"+(err?" err":"")}
async function payConfirm(id){
 let o=null;try{o=JSON.parse(sessionStorage.getItem("rax3d_pay")||localStorage.getItem("rax3d_pay")||"null")}catch(_){}
 if(!o)o=window.LASTORD||null;
 if(!o)o={};
 $("#paymysr").hidden=true;$("#payform").hidden=false;$("#payform").innerHTML=`<p class="total">تم الدفع ✓</p><p class="inote">جاري تأكيد طلبك…</p>`;$("#paybg").hidden=false;
 try{const r=await fetch(PAY.api+"/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({paymentId:id,ref:o.ref,mode:o.mode,customer:o.customer,cart:o.cart})});
  const j=await r.json();
  if(j.ok){const RL=rcptLines(o.cart);try{sessionStorage.removeItem("rax3d_pay");localStorage.removeItem("rax3d_pay")}catch(_){}cart.length=0;OREF="";cartUI();
   $("#paymysr").hidden=true;$("#payform").hidden=false;$("#payform").innerHTML=`<p class="total">تم الدفع ✓</p><p class="inote">${j.num?`رقم طلبك <b dir="ltr">ORD-${+j.num}</b>. `:""}وصلنا طلبك وبنتواصل معك لتأكيد التجهيز والتسليم.</p>`+(j.num&&RL.length?receiptHtml(+j.num,RL,PAY.modes&&o.mode==="pickup"?0:PAY.ship,true):"");$("#paybg").hidden=false;render(false);return true}
  $("#payform").hidden=false;$("#payform").innerHTML=`<p class="inote">${j.paid?"تم الدفع، لكن نحتاج نراجع طلبك يدويًا. تواصل معنا ومعك رقم الدفعة <b dir=\"ltr\">"+esc(String(id).slice(-8))+"</b>.":"ما تأكد الدفع الحين (<span dir=\"ltr\">"+esc((j.reason||"")+(j.status?":"+j.status:"")+(j.code?":"+j.code:""))+"</span>). إذا انخصم منك مبلغ تواصل معنا ومعك رقم الدفعة <b dir=\"ltr\">"+esc(String(id).slice(-8))+"</b>."}</p>`;$("#paybg").hidden=false;return false
 }catch(_){$("#payform").hidden=false;$("#payform").innerHTML=`<p class="inote">تعذر التحقق من الدفع الحين. لا تدفع مرة ثانية، تواصل معنا ومعك رقم الدفعة <b dir="ltr">${esc(String(id).slice(-8))}</b>.</p>`;$("#paybg").hidden=false;return false}
}
document.addEventListener("click",async e=>{
 const t=e.target.closest("#payBtn,#paygo,#payclose");if(!t)return;
 if(t.id==="payclose"){$("#paybg").hidden=true;return}
 if(t.id==="payBtn"){if(!payable())return;formFresh("payform","pay");$("#payName").value=CUST?CUST.n:"";$("#payPhone").value=CUST?CUST.p:"";payMsg("");$("#payform").hidden=false;$("#paymysr").hidden=true;
  PMODE="";{const m=$("#payModes");m.hidden=!PAY.modes;m.querySelectorAll("input").forEach(i=>{i.checked=false});$("#modeDelFee").textContent="رسوم "+PAY.ship+" ريال"}payTotUI();$("#paybg").hidden=false;if(!PAY.modes&&CUST&&CUST.n&&/^05\d{8}$/.test(CUST.p||""))setTimeout(()=>$("#paygo").click(),0);return}
 const n=$("#payName").value.trim(),p=$("#payPhone").value.replace(/\s/g,"");
 if(n.length<2||!/^(05\d{8}|\+?9665\d{8})$/.test(p)){payMsg("عبّي الاسم والجوال (05xxxxxxxx).",true);return}
 if(PAY.modes&&!PMODE){payMsg("اختر طريقة الاستلام: توصيل أو استلام مباشر.",true);return}
 const ref=orderCode(),order={ref,mode:PAY.modes?PMODE:"",customer:{name:n,phone:p},cart:cart.map(o=>({id:o.id,qty:o.qty,color:o.color}))};
 window.LASTORD=order;try{sessionStorage.setItem("rax3d_pay",JSON.stringify(order));localStorage.setItem("rax3d_pay",JSON.stringify(order))}catch(_){}
 try{await payLoad()}catch(_){payMsg("تعذر تحميل بوابة الدفع، جرّب مرة ثانية.",true);return}
 $("#payform").hidden=true;const f=$("#paymysr");f.hidden=false;f.innerHTML="";
 Moyasar.init({element:"#paymysr",amount:payTotal()*100,currency:"SAR",description:"RAX3D "+ref,publishable_api_key:PAY.pk,
  callback_url:location.origin+"/?pay=done",methods:PAY.methods,supported_networks:["visa","mastercard","mada"],
  ...(PAY.methods.includes("applepay")?{apple_pay:{country:"SA",label:"RAX3D",version:6,merchant_capabilities:["supports3DS"],validate_merchant_url:"https://api.moyasar.com/v1/applepay/initiate"}}:{}),
  metadata:{ref,name:n,phone:p,...(PAY.modes?{mode:PMODE}:{}),items:cart.map(o=>o.id+"x"+o.qty).join(",").slice(0,400),cols:cart.map(o=>o.id+":"+(o.color||"")).join(",").slice(0,250)},
  on_completed:async pay=>{await payConfirm(pay.id)}})
});
const FORMS={cod:$("#codform").innerHTML,pay:$("#payform").innerHTML};
const formFresh=(id,k)=>{const f=$("#"+id);if(!f.querySelector("input"))f.innerHTML=FORMS[k]};
const codable=()=>!!(PAY.api&&withinLimits()&&(!PAY.gate||PTEST)&&cart.length&&cart.every(o=>UP(o.id,o.qty)&&!o.size&&!o.note));
const codMsg=(t,err)=>{const m=$("#codmsg");m.textContent=t;m.className="dmsg"+(err?" err":"")};
document.addEventListener("click",async e=>{
 const t=e.target.closest("#codBtn,#codgo,#codclose");if(!t)return;
 if(t.id==="codclose"){$("#codbg").hidden=true;return}
 if(t.id==="codBtn"){if(!codable())return;formFresh("codform","cod");$("#codName").value=CUST?CUST.n:"";$("#codPhone").value=CUST?CUST.p:"";codMsg("");$("#codform").hidden=false;
  {const known=!!(CUST&&CUST.n&&/^05\d{8}$/.test(CUST.p||""));["codName","codPhone"].forEach(i=>{$("#"+i).style.display=known?"none":"";const l=document.querySelector(`label[for=${i}]`);if(l)l.style.display=known?"none":""});const w=$("#codwho");w.hidden=!known;if(known)w.innerHTML=`الطلب باسم <b>${esc(CUST.n)}</b> · <span dir="ltr">${esc(CUST.p)}</span>`}
  $("#codtot").textContent=`الإجمالي عند الاستلام: ${codTotal()} ريال`+(codFee()?` (يشمل التوصيل ${codFee()})`:"");$("#codbg").hidden=false;return}
 const n=$("#codName").value.trim(),p=$("#codPhone").value.replace(/\s/g,"");
 if(n.length<2||!/^(05\d{8}|\+?9665\d{8})$/.test(p)){codMsg("عبّي الاسم والجوال (05xxxxxxxx).",true);return}
 t.disabled=true;codMsg("جاري إرسال طلبك…");
 const ref=orderCode();
 let ts=null;if(PAY.ts){try{ts=await tsToken()}catch(_){codMsg("تعذّر التحقق الأمني. جرّب مرة ثانية أو أرسل الطلب بالخاص.",true);t.disabled=false;return}}
 try{const r=await fetch(PAY.api+"/cod",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ref,ts,customer:{name:n,phone:p,city:"يُحدد بالتواصل",address:"يُحدد بالتواصل"},cart:cart.map(o=>({id:o.id,qty:o.qty,color:o.color}))})});
  const j=await r.json();
  if(j.ok){const RL=rcptLines(cart);cart.length=0;OREF="";cartUI();$("#codform").innerHTML=`<p class="total">وصلنا طلبك ✓</p><p class="inote">رقم طلبك <b dir="ltr">ORD-${+j.num}</b>. بنتواصل معك لتأكيد التجهيز وموعد الاستلام، وتدفع عند الاستلام.</p>`+(RL.length?receiptHtml(+j.num,RL,codFee(),false):"");render(false);return}
  codMsg(j.reason==="captcha"?"ما تم التحقق الأمني. جرّب مرة ثانية أو أرسل الطلب بالخاص.":j.reason==="fields"?"تأكد من الاسم والجوال.":j.reason==="limit"?"وصلت للحد اليومي لطلبات الدفع عند الاستلام. تواصل معنا بالخاص.":j.reason==="max"?"الطلبات الكبيرة ما تمشي بالدفع عند الاستلام، ادفع أونلاين أو أرسل الطلب بالخاص.":"ما تم إرسال الطلب، جرّب مرة ثانية أو أرسله بالخاص.",true)
 }catch(_){codMsg("ما فيه اتصال، جرّب مرة ثانية.",true)}
 t.disabled=false
});
(()=>{try{const q=new URLSearchParams(location.search);if(q.get("pay")==="done"&&q.get("id")){const id=q.get("id"),st=q.get("status");history.replaceState(null,"",location.pathname);
 if(st==="paid")payConfirm(id);else{$("#payform").innerHTML=`<p class="inote">ما تمت عملية الدفع (${esc(q.get("message")||st||"")}). تقدر تحاول مرة ثانية من «طلبي».</p>`;$("#paybg").hidden=false}}}catch(_){}})();
loadPts();render(false);applyLang();
