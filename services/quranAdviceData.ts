export interface QuranAdvice {
  id: string;
  category: string;
  text: string;
  source: string; // Sure ve Ayet No
  context: string; // Hangi durumda hatırlanmalı
}

export const quranAdviceList: QuranAdvice[] = [
  // --- İLETİŞİM, ÜSLUP VE KONUŞMA ---
  {
    id: 'speech_kindness',
    category: 'İletişim',
    text: "Kullarıma söyle, sözün en güzelini söylesinler. Çünkü şeytan aralarını bozar.",
    source: "İsrâ Suresi, 53. Ayet",
    context: "Biriyle konuşurken veya tartışırken"
  },
  {
    id: 'gentle_speech',
    category: 'İletişim',
    text: "Ona (Firavun'a) yumuşak söz söyleyin. Belki öğüt alır veya korkar.",
    source: "Tâhâ Suresi, 44. Ayet",
    context: "Sert mizaçlı veya otorite sahibi biriyle konuşurken"
  },
  {
    id: 'moderation_voice',
    category: 'İletişim',
    text: "Yürüyüşünde tabiî ol. Sesini alçalt. Çünkü seslerin en çirkini, şüphesiz eşeklerin sesidir.",
    source: "Lokmân Suresi, 19. Ayet",
    context: "Toplum içinde konuşurken ses tonunu ayarlamada"
  },
  {
    id: 'straight_speech',
    category: 'İletişim',
    text: "Ey iman edenler! Allah'tan sakının ve doğru söz söyleyin ki, Allah işlerinizi düzeltsin.",
    source: "Ahzâb Suresi, 70-71. Ayet",
    context: "Lafı dolandırmadan, dürüstçe konuşmak gerektiğinde"
  },
  {
    id: 'avoid_vain_talk',
    category: 'İletişim',
    text: "Onlar ki, boş ve yararsız şeylerden yüz çevirirler.",
    source: "Mü'minûn Suresi, 3. Ayet",
    context: "Faydasız geyik muhabbeti veya dedikodu ortamında"
  },
  {
    id: 'good_word_tree',
    category: 'İletişim',
    text: "Görmedin mi Allah nasıl bir misal getirdi: Güzel bir söz, kökü (yerde) sabit, dalları gökte olan güzel bir ağaç gibidir.",
    source: "İbrâhîm Suresi, 24. Ayet",
    context: "İnsanlara iltifat ederken veya moral verirken"
  },
  {
    id: 'ignorant_response',
    category: 'İletişim',
    text: "Rahman'ın kulları yeryüzünde vakarla yürürler. Cahiller onlara laf attıkları zaman, 'Selam' der (geçer)ler.",
    source: "Furkân Suresi, 63. Ayet",
    context: "Seviyesiz bir tartışmaya çekilmek istendiğinde"
  },
  {
    id: 'debate_style',
    category: 'İletişim',
    text: "Rabbinin yoluna hikmetle ve güzel öğütle çağır. Onlarla en güzel yöntemle mücadele et.",
    source: "Nahl Suresi, 125. Ayet",
    context: "Fikir tartışmasına girdiğinde"
  },
  {
    id: 'public_speech',
    category: 'İletişim',
    text: "Allah, zulme uğrayanlar dışında, kötü sözün açıkça söylenmesini sevmez.",
    source: "Nisâ Suresi, 148. Ayet",
    context: "Toplum içinde bağırarak veya küfrederek konuşulduğunda"
  },

  // --- DUYGUSAL ZEKA & PSİKOLOJİ ---
  {
    id: 'anger_management',
    category: 'Duygusal Kontrol',
    text: "O takva sahipleri ki, bollukta da darlıkta da Allah için harcarlar; öfkelerini yutarlar ve insanları affederler.",
    source: "Âl-i İmrân Suresi, 134. Ayet",
    context: "Öfkelendiğin ve sabrının taştığı anlarda"
  },
  {
    id: 'grief_complaint',
    category: 'Psikoloji',
    text: "(Yakup) Dedi ki: Ben tasamı ve üzüntümü ancak Allah'a arz ederim.",
    source: "Yûsuf Suresi, 86. Ayet",
    context: "Derdini kimseye anlatamadığında, içine attığında"
  },
  {
    id: 'grief_console',
    category: 'Motivasyon',
    text: "Gevşemeyin, üzülmeyin. Eğer (gerçekten) iman etmişseniz, en üstün olan sizsiniz.",
    source: "Âl-i İmrân Suresi, 139. Ayet",
    context: "Kendini başarısız veya yenilmiş hissettiğinde"
  },
  {
    id: 'hope_despair',
    category: 'Umut',
    text: "De ki: Ey kendilerine kötülük edip aşırı giden kullarım! Allah'ın rahmetinden umudunuzu kesmeyin. Allah bütün günahları bağışlar.",
    source: "Zümer Suresi, 53. Ayet",
    context: "Büyük bir hata yaptığında veya vicdan azabı çektiğinde"
  },
  {
    id: 'anxiety_peace',
    category: 'Huzur',
    text: "Bilesiniz ki, kalpler ancak Allah'ı anmakla huzur bulur.",
    source: "Ra'd Suresi, 28. Ayet",
    context: "İçinde sebepsiz bir sıkıntı veya kaygı olduğunda"
  },
  {
    id: 'hardship_ease',
    category: 'Motivasyon',
    text: "Şüphesiz güçlükle beraber bir kolaylık vardır. Gerçekten, güçlükle beraber bir kolaylık vardır.",
    source: "İnşirah Suresi, 5-6. Ayet",
    context: "Dertler üst üste geldiğinde"
  },
  {
    id: 'fear_future',
    category: 'Psikoloji',
    text: "Şeytan sizi fakirlikle korkutur ve size cimriliği emreder. Allah ise size katından bir bağışlanma ve lütuf vaad eder.",
    source: "Bakara Suresi, 268. Ayet",
    context: "Gelecek kaygısı ve maddi korkular sardığında"
  },
  {
    id: 'loneliness',
    category: 'Psikoloji',
    text: "Andolsun, insanı biz yarattık ve nefsinin ona ne vesveseler verdiğini biliriz. Biz ona şah damarından daha yakınız.",
    source: "Kâf Suresi, 16. Ayet",
    context: "Kendini yapayalnız hissettiğinde"
  },
  {
    id: 'regret_past',
    category: 'Psikoloji',
    text: "Elinizden çıkana üzülmeyesiniz ve Allah'ın size verdiği nimetlerle şımarmayasınız diye (bunu bildirdik).",
    source: "Hadîd Suresi, 23. Ayet",
    context: "Geçmişteki kayıplara takılıp kaldığında"
  },

  // --- SOSYAL İLİŞKİLER, AHLAK & ADAB-I MUAŞERET ---
  {
    id: 'gossip_avoidance',
    category: 'Sosyal İlişkiler',
    text: "Ey iman edenler! Zannın çoğundan sakının; çünkü bazı zanlar günahtır. Birbirinizin kusurunu araştırmayın, kimse kimseyi çekiştirmesin.",
    source: "Hucurât Suresi, 12. Ayet",
    context: "Başkası hakkında konuşulurken veya şüpheye düşüldüğünde"
  },
  {
    id: 'mockery',
    category: 'Sosyal İlişkiler',
    text: "Ey iman edenler! Bir topluluk diğer bir toplulukla alay etmesin. Belki de onlar, kendilerinden daha hayırlıdırlar.",
    source: "Hucurât Suresi, 11. Ayet",
    context: "Birini küçümseme hissi geldiğinde veya mizah yaparken"
  },
  {
    id: 'humility_walk',
    category: 'Tevazu',
    text: "Yeryüzünde böbürlenerek yürüme. Çünkü sen yeri asla yaramazsın, boyca da dağlara asla erişemezsin.",
    source: "İsrâ Suresi, 37. Ayet",
    context: "Kendini başkalarından üstün gördüğünde"
  },
  {
    id: 'cheek_turn',
    category: 'Kibirden Sakınma',
    text: "Küçümseyerek insanlardan yüz çevirme ve yeryüzünde böbürlenerek yürüme.",
    source: "Lokmân Suresi, 18. Ayet",
    context: "İnsanlara tepeden bakma hissi geldiğinde"
  },
  {
    id: 'forgiveness_choice',
    category: 'Affedicilik',
    text: "Affı seç, iyiliği emret ve cahillerden yüz çevir.",
    source: "A'râf Suresi, 199. Ayet",
    context: "Sana kaba davranıldığında"
  },
  {
    id: 'greeting',
    category: 'Nezaket',
    text: "Size bir selam verildiği zaman, ondan daha güzeliyle veya aynı selamla karşılık verin.",
    source: "Nisâ Suresi, 86. Ayet",
    context: "Biriyle karşılaştığında veya mesajlaştığında"
  },
  {
    id: 'good_evil_repel',
    category: 'İyilik',
    text: "İyilikle kötülük bir olmaz. Sen kötülüğü en güzel bir şekilde sav. O zaman seninle arasında düşmanlık bulunan kimse, sanki candan bir dost olur.",
    source: "Fussilet Suresi, 34. Ayet",
    context: "Sana yapılan bir kötülüğe karşılık verirken"
  },
  {
    id: 'permission_enter',
    category: 'Görgü Kuralı',
    text: "Ey iman edenler! Kendi evlerinizden başka evlere, geldiğinizi hissettirip ev halkına selam vermeden girmeyin.",
    source: "Nûr Suresi, 27. Ayet",
    context: "Misafirliğe giderken veya birinin odasına girerken"
  },
  {
    id: 'make_room',
    category: 'Görgü Kuralı',
    text: "Ey iman edenler! Size meclislerde 'Yer açın' denilince yer açın ki Allah da size genişlik versin.",
    source: "Mücâdele Suresi, 11. Ayet",
    context: "Toplu taşımada veya kalabalık bir ortamda"
  },

  // --- AİLE, EVLİLİK & AKRABALIK ---
  {
    id: 'parents_kindness',
    category: 'Aile',
    text: "Rabbin, kendisinden başkasına kulluk etmemenizi ve ana-babaya iyilik etmenizi emretti. Onlardan biri veya her ikisi senin yanında yaşlanırlarsa, onlara 'öf' bile deme!",
    source: "İsrâ Suresi, 23. Ayet",
    context: "Anne ve babanla ilişkilerinde sabrın zorlandığında"
  },
  {
    id: 'spouses_love',
    category: 'Evlilik',
    text: "Kendileri ile huzur bulasınız diye sizin için türünüzden eşler yaratması ve aranızda bir sevgi ve merhamet var etmesi de O'nun (varlığının) delillerindendir.",
    source: "Rûm Suresi, 21. Ayet",
    context: "Eşinle tartışırken veya aradaki bağ zayıfladığında"
  },
  {
    id: 'wife_treatment',
    category: 'Evlilik',
    text: "Onlarla (kadınlarla) iyi geçinin. Eğer onlardan hoşlanmadıysanız, olabilir ki, siz bir şeyden hoşlanmazsınız da Allah onda pek çok hayır yaratmış olur.",
    source: "Nisâ Suresi, 19. Ayet",
    context: "Eşinin bir huyuna kızdığında"
  },
  {
    id: 'divorce_conduct',
    category: 'Evlilik',
    text: "(Boşama sırasında) Ya iyilikle tutun veya güzellikle serbest bırakın.",
    source: "Bakara Suresi, 229. Ayet",
    context: "Ayrılık veya boşanma aşamasında medeni olmak için"
  },
  {
    id: 'family_prayer',
    category: 'Aile',
    text: "Ailene namazı emret ve kendin de ona sabırla devam et.",
    source: "Tâhâ Suresi, 132. Ayet",
    context: "Ailenin manevi sorumluluğunu hissettiğinde"
  },
  {
    id: 'relatives_rights',
    category: 'Akrabalık',
    text: "Akrabaya, yoksula ve yolda kalmışa hakkını ver.",
    source: "İsrâ Suresi, 26. Ayet",
    context: "Akraba ziyaretini aksattığında veya onlara yardım etmen gerektiğinde"
  },

  // --- İŞ, TİCARET, EKONOMİ & BORÇ ---
  {
    id: 'trade_honesty',
    category: 'Ticaret',
    text: "Ölçtüğünüz zaman tastamam ölçün ve doğru terazi ile tartın. Bu, hem daha iyidir hem de neticesi bakımından daha güzeldir.",
    source: "İsrâ Suresi, 35. Ayet",
    context: "Alışveriş yaparken, mal tartarken veya iş teslim ederken"
  },
  {
    id: 'full_measure',
    category: 'Ticaret',
    text: "Eksik ölçüp tartanların vay haline! Onlar insanlardan bir şey aldıkları zaman tam ölçerler. Fakat kendileri onlara bir şey ölçüp tarttıkları zaman eksik yaparlar.",
    source: "Mutaffifîn Suresi, 1-3. Ayet",
    context: "İş hayatında kaytarma veya hile yapma fırsatı olduğunda"
  },
  {
    id: 'bribery',
    category: 'İş Ahlakı',
    text: "Aranızda birbirinizin mallarını haksız yere yemeyin. İnsanların mallarından bir kısmını bile bile günaha girerek yemek için onları hakimlere (rüşvet olarak) vermeyin.",
    source: "Bakara Suresi, 188. Ayet",
    context: "Haksız kazanç, torpil veya rüşvet söz konusu olduğunda"
  },
  {
    id: 'debt_writing',
    category: 'Borçlanma',
    text: "Ey iman edenler! Belirlenmiş bir süre için birbirinize borçlandığınız vakit onu yazın. Aranızda bir yazıcı adaletle yazsın.",
    source: "Bakara Suresi, 282. Ayet",
    context: "Arkadaşına borç verirken veya borç alırken (kayıt altına alma)"
  },
  {
    id: 'interest_avoid',
    category: 'Ekonomi',
    text: "Allah alışverişi helal, faizi haram kılmıştır.",
    source: "Bakara Suresi, 275. Ayet",
    context: "Faizli işlemlere girmeyi düşünürken"
  },
  {
    id: 'eating_wealth',
    category: 'Miras/Mal',
    text: "Ey iman edenler! Mallarınızı aranızda batıl yollarla yemeyin.",
    source: "Nisâ Suresi, 29. Ayet",
    context: "Miras paylaşımında veya ortaklıkta haksızlık yapma ihtimalinde"
  },
  {
    id: 'charity_public_private',
    category: 'İnfak',
    text: "Sadakaları açıkta verirseniz ne güzel! Fakat onları gizleyerek fakirlere verirseniz bu, sizin için daha hayırlıdır.",
    source: "Bakara Suresi, 271. Ayet",
    context: "Yardım yaparken gösterişten kaçınmak için"
  },

  // --- BİLGİ, ZİHİN, MEDYA & SOSYAL MEDYA ---
  {
    id: 'verify_news',
    category: 'Medya Okuryazarlığı',
    text: "Ey iman edenler! Size bir fasık bir haber getirirse, bilmeyerek bir topluluğa zarar verip yaptığınıza pişman olmamak için o haberin doğruluğunu araştırın.",
    source: "Hucurât Suresi, 6. Ayet",
    context: "Sosyal medyada duyduğun şok edici bir haberi paylaşmadan önce"
  },
  {
    id: 'unknown_pursuit',
    category: 'Bilimsel Düşünce',
    text: "Hakkında bilgin olmayan şeyin ardına düşme. Çünkü kulak, göz ve kalp, bunların hepsi ondan sorumludur.",
    source: "İsrâ Suresi, 36. Ayet",
    context: "Emin olmadığın konularda yorum yaparken veya komplo teorilerine dalarken"
  },
  {
    id: 'conjecture_truth',
    category: 'Bilimsel Düşünce',
    text: "Onların çoğu zandan başka bir şeye uymaz. Şüphesiz zan, haktan (ilimden) hiçbir şeyin yerini tutmaz.",
    source: "Yûnus Suresi, 36. Ayet",
    context: "Önyargılı davranırken veya delilsiz konuşurken"
  },
  {
    id: 'gaze_control',
    category: 'Dijital İffet',
    text: "Mümin erkeklere söyle, gözlerini haramdan sakınsınlar... Mümin kadınlara da söyle, gözlerini haramdan sakınsınlar.",
    source: "Nûr Suresi, 30-31. Ayet",
    context: "İnternette veya dışarıda uygunsuz görüntülerle karşılaştığında"
  },
  {
    id: 'slander_lovers',
    category: 'Sosyal Medya',
    text: "Müminlerin arasında çirkinliğin yayılmasından hoşlananlar için dünyada da ahirette de elem verici bir azap vardır.",
    source: "Nûr Suresi, 19. Ayet",
    context: "Magazin, ifşa veya skandal videolarını izlerken/yayarken"
  },

  // --- KARAKTER, ERDEMLER & LİDERLİK ---
  {
    id: 'promise_keeping',
    category: 'Karakter',
    text: "Verdiğiniz sözü de yerine getirin. Çünkü söz (veren sözünden) sorumludur.",
    source: "İsrâ Suresi, 34. Ayet",
    context: "Bir söz verdiğinde veya randevulaştığında"
  },
  {
    id: 'trust_amanah',
    category: 'Liderlik',
    text: "Allah size, emanetleri ehline vermenizi ve insanlar arasında hükmettiğiniz zaman adaletle hükmetmenizi emreder.",
    source: "Nisâ Suresi, 58. Ayet",
    context: "Bir işe eleman alırken, oy kullanırken veya yöneticilik yaparken"
  },
  {
    id: 'justice_fairness',
    category: 'Adalet',
    text: "Ey iman edenler! Adaleti titizlikle ayakta tutan, kendiniz, ana-babanız ve akrabanız aleyhinde de olsa Allah için şahitlik eden kimseler olun.",
    source: "Nisâ Suresi, 135. Ayet",
    context: "Kendi yakının haksız olduğunda bile doğruyu söylerken"
  },
  {
    id: 'enemies_justice',
    category: 'Adalet',
    text: "Bir topluluğa olan kininiz, sizi adaletsizliğe sevk etmesin. Adil olun.",
    source: "Mâide Suresi, 8. Ayet",
    context: "Sevmediğin birinin davasında karar verirken"
  },
  {
    id: 'consultation',
    category: 'Yönetim',
    text: "...İş konusunda onlarla müşavere et. Bir kere de karar verip azmettin mi, artık Allah'a tevekkül et.",
    source: "Âl-i İmrân Suresi, 159. Ayet",
    context: "Önemli bir karar almadan önce danışmak gerektiğinde"
  },
  {
    id: 'showing_off',
    category: 'İhlas',
    text: "Yazıklar olsun o namaz kılanlara ki... Onlar gösteriş yaparlar.",
    source: "Mâ'ûn Suresi, 4-6. Ayet",
    context: "İbadetlerini veya iyiliklerini like almak veya övülmek için yaptığında"
  },
  {
    id: 'orphans_needy',
    category: 'Merhamet',
    text: "Öyleyse yetimi sakın ezme. El açıp isteyeni de sakın azarlama.",
    source: "Duhâ Suresi, 9-10. Ayet",
    context: "Yardıma muhtaç veya zayıf birini gördüğünde"
  },
  {
    id: 'race_goodness',
    category: 'Aksiyon',
    text: "Herkesin yöneldiği bir yön vardır. Haydi, hep hayırlara koşun, yarışın!",
    source: "Bakara Suresi, 148. Ayet",
    context: "Tembellik hissettiğinde veya ertelediğinde"
  },
  {
    id: 'great_character',
    category: 'Karakter',
    text: "Ve şüphesiz sen, yüce bir ahlak üzeresin.",
    source: "Kalem Suresi, 4. Ayet",
    context: "Peygamberimizi örnek almak istediğinde"
  },

  // --- DOĞA, BİLİM, SANAT & TEF EKKÜR ---
  {
    id: 'creation_heavens',
    category: 'Bilim & Tefekkür',
    text: "Göklerin ve yerin yaratılışında, gece ile gündüzün birbiri ardınca gelip gidişinde aklıselim sahipleri için gerçekten ibretler vardır.",
    source: "Âl-i İmrân Suresi, 190. Ayet",
    context: "Gökyüzüne, yıldızlara veya doğaya bakarken"
  },
  {
    id: 'water_life',
    category: 'Bilim',
    text: "İnkâr edenler görmediler mi ki göklerle yer bitişikti, biz onları ayırdık ve her canlı şeyi sudan yarattık?",
    source: "Enbiyâ Suresi, 30. Ayet",
    context: "Suyun önemini ve yaşamın kaynağını düşünürken"
  },
  {
    id: 'orbits',
    category: 'Bilim',
    text: "Ne güneş aya yetişebilir, ne de gece gündüzü geçebilir. Her biri bir yörüngede yüzerler.",
    source: "Yâsîn Suresi, 40. Ayet",
    context: "Astronomi veya uzay hakkında düşünürken"
  },
  {
    id: 'embryology',
    category: 'Bilim',
    text: "Andolsun biz insanı, çamurdan süzülmüş bir özden yarattık. Sonra onu az bir su (meni) halinde sağlam bir karargâha yerleştirdik...",
    source: "Mü'minûn Suresi, 12-14. Ayet",
    context: "İnsanın yaratılış mucizesini düşünürken"
  },
  {
    id: 'beauty_creation',
    category: 'Sanat & Estetik',
    text: "O ki, yarattığı her şeyi güzel yaptı.",
    source: "Secde Suresi, 7. Ayet",
    context: "Doğadaki bir manzaraya veya sanat eserine hayran kaldığında"
  },
  {
    id: 'adornment',
    category: 'Estetik',
    text: "De ki: Allah'ın kulları için yarattığı süsü ve temiz rızıkları kim haram kıldı?",
    source: "A'râf Suresi, 32. Ayet",
    context: "Güzel giyinmek veya bakım yapmak istediğinde"
  },
  {
    id: 'colors_diversity',
    category: 'Çeşitlilik',
    text: "Göklerin ve yerin yaratılması, dillerinizin ve renklerinizin farklı olması da O'nun (varlığının) delillerindendir.",
    source: "Rûm Suresi, 22. Ayet",
    context: "Farklı kültürler, diller veya ırklar gördüğünde"
  },

  // --- SAĞLIK, SPOR & BEDEN ---
  {
    id: 'eat_drink_waste',
    category: 'Sağlık',
    text: "Yiyin için fakat israf etmeyin. Çünkü O, israf edenleri sevmez.",
    source: "A'râf Suresi, 31. Ayet",
    context: "Sofrada çok yemek yeme isteği geldiğinde (Obezite/Diyet)"
  },
  {
    id: 'cleanliness_love',
    category: 'Temizlik',
    text: "Şüphesiz Allah, çok tövbe edenleri sever, çok temizlenenleri de sever.",
    source: "Bakara Suresi, 222. Ayet",
    context: "Kişisel bakım, banyo ve çevre temizliği konusunda"
  },
  {
    id: 'sleep_rest',
    category: 'Sağlık',
    text: "Uykunuzu bir dinlenme kıldık.",
    source: "Nebe Suresi, 9. Ayet",
    context: "Uykusuzluk çektiğinde veya çok uyuduğunda"
  },
  {
    id: 'physical_strength',
    category: 'Spor',
    text: "Allah onu sizin üzerinize seçti, ilim ve bedence ona üstünlük verdi.",
    source: "Bakara Suresi, 247. Ayet",
    context: "Spor yaparken veya fiziksel gücünü artırmaya çalışırken"
  },

  // --- SORUMLULUK, İRADE & KADER ---
  {
    id: 'soul_responsibility',
    category: 'Sorumluluk',
    text: "Hiçbir günahkâr başkasının günahını yüklenmez.",
    source: "Fâtır Suresi, 18. Ayet",
    context: "Hataların suçunu başkasına atmak istediğinde"
  },
  {
    id: 'change_self',
    category: 'Değişim',
    text: "Şüphesiz ki, bir kavim kendi durumunu değiştirmedikçe Allah onların durumunu değiştirmez.",
    source: "Ra'd Suresi, 11. Ayet",
    context: "Hayatından şikayet edip harekete geçmediğinde"
  },
  {
    id: 'effort_man',
    category: 'Çalışma',
    text: "İnsan için ancak çalıştığı vardır.",
    source: "Necm Suresi, 39. Ayet",
    context: "Emeksiz kazanç beklediğinde veya pes ettiğinde"
  },
  {
    id: 'will_test',
    category: 'İmtihan',
    text: "Andolsun ki sizi biraz korku ve açlık; mallardan, canlardan ve ürünlerden biraz azaltma (fakirlik) ile deneriz. Sabredenleri müjdele!",
    source: "Bakara Suresi, 155. Ayet",
    context: "Ekonomik kriz veya hastalık anında"
  },
  {
    id: 'hasty_man',
    category: 'Fıtrat',
    text: "İnsan hayrı istediği kadar şerri de ister. İnsan çok acelecidir.",
    source: "İsrâ Suresi, 11. Ayet",
    context: "Bir şeyin hemen olmasını istediğinde, sabırsızlandığında"
  },

  // --- DÜNYA ALGISI & AHİRET ---
  {
    id: 'life_play',
    category: 'Dünya Algısı',
    text: "Bu dünya hayatı ancak bir eğlence ve oyundan ibarettir. Ahiret yurduna gelince, işte gerçek hayat odur.",
    source: "Ankebût Suresi, 64. Ayet",
    context: "Dünya dertlerini gözünde çok büyüttüğünde"
  },
  {
    id: 'world_decoration',
    category: 'Dünya Algısı',
    text: "Kadınlar, oğullar, yığın yığın biriktirilmiş altın ve gümüş... bunlara olan sevgi insanlara süslü gösterildi. Bunlar dünya hayatının geçimidir.",
    source: "Âl-i İmrân Suresi, 14. Ayet",
    context: "Lüks yaşama veya mala mülke aşırı heveslendiğinde"
  },
  {
    id: 'death_taste',
    category: 'Ölüm',
    text: "Her can ölümü tadacaktır. Sonra bize döndürüleceksiniz.",
    source: "Ankebût Suresi, 57. Ayet",
    context: "Bir cenaze gördüğünde veya ölümü hatırladığında"
  },
  {
    id: 'prepare_tomorrow',
    category: 'Gelecek',
    text: "Ey iman edenler! Allah'tan korkun ve herkes, yarın için ne hazırladığına baksın.",
    source: "Haşr Suresi, 18. Ayet",
    context: "Günübirlik yaşayıp geleceği (ahireti) unuttuğunda"
  },

  // --- ZULÜM, SAVAŞ & BARIŞ ---
  {
    id: 'killing_humanity',
    category: 'Yaşam Hakkı',
    text: "Kim, bir cana kıymayan veya yeryüzünde bozgunculuk çıkarmayan bir nefsi öldürürse, bütün insanları öldürmüş gibi olur.",
    source: "Mâide Suresi, 32. Ayet",
    context: "Terör, şiddet veya cinayet haberleri duyduğunda"
  },
  {
    id: 'unity_rope',
    category: 'Birlik',
    text: "Hep birlikte Allah'ın ipine (Kur'an'a) sımsıkı sarılın. Parçalanıp bölünmeyin.",
    source: "Âl-i İmrân Suresi, 103. Ayet",
    context: "Toplumsal ayrışma veya gruplaşma olduğunda"
  },
  {
    id: 'repay_evil',
    category: 'Erdem',
    text: "Kötülüğün cezası, yine onun gibi bir kötülüktür. Kim affeder ve arayı düzeltirse, onun mükafatı Allah'a aittir.",
    source: "Şûrâ Suresi, 40. Ayet",
    context: "İntikam alma isteği duyduğunda"
  },
  {
    id: 'others_gods',
    category: 'Hoşgörü',
    text: "Allah'tan başkasına tapanlara (ve putlarına) sövmeyin; sonra onlar da bilmeyerek Allah'a söverler.",
    source: "En'âm Suresi, 108. Ayet",
    context: "Başka dinlere veya inançlara mensup kişilerle konuşurken"
  },
  {
    id: 'justice_nonbelievers',
    category: 'Adalet',
    text: "Allah, din konusunda sizinle savaşmayan ve sizi yurtlarınızdan çıkarmayanlarla iyilik etmenizi ve onlara adaletli davranmanızı yasaklamaz.",
    source: "Mümtehine Suresi, 8. Ayet",
    context: "Müslüman olmayan komşulara veya insanlara davranışta"
  },

  // --- İBADET & MANEVİYAT ---
  {
    id: 'night_prayer',
    category: 'İbadet',
    text: "Gecenin bir kısmında uyanarak, sana mahsus bir nafile olmak üzere namaz kıl. Belki böylece Rabbin seni övülmüş bir makama ulaştırır.",
    source: "İsrâ Suresi, 79. Ayet",
    context: "Gece uykusu bölündüğünde veya manevi yükseliş aradığında"
  },
  {
    id: 'god_near',
    category: 'Dua',
    text: "Kullarım sana beni sorduğunda, (bilsinler ki) ben şüphesiz onlara çok yakınım. Bana dua ettiğinde dua edenin duasına icabet ederim.",
    source: "Bakara Suresi, 186. Ayet",
    context: "Kendini yalnız ve kimsesiz hissettiğinde"
  },
  {
    id: 'prayer_immorality',
    category: 'Namaz',
    text: "Muhakkak ki namaz, hayâsızlıktan ve kötülükten alıkoyar.",
    source: "Ankebût Suresi, 45. Ayet",
    context: "Namazın hayatındaki etkisini sorguladığında"
  },
  {
    id: 'gratitude_increase',
    category: 'Şükür',
    text: "Hani Rabbiniz şöyle duyurmuştu: 'Andolsun, eğer şükrederseniz elbette size nimetimi artırırım.'",
    source: "İbrâhîm Suresi, 7. Ayet",
    context: "Güzel bir nimete kavuştuğunda"
  },
  {
    id: 'satan_enemy',
    category: 'Farkındalık',
    text: "Şüphesiz şeytan sizin için bir düşmandır. Öyleyse siz de onu düşman tanıyın.",
    source: "Fâtır Suresi, 6. Ayet",
    context: "İçinden kötü bir vesvese veya günah isteği geçtiğinde"
  },
  {
    id: 'say_inshallah',
    category: 'Tevekkül',
    text: "Hiçbir şey için 'Bunu yarın mutlaka yapacağım' deme. Ancak 'Allah dilerse (İnşallah)' de.",
    source: "Kehf Suresi, 23-24. Ayet",
    context: "Gelecekle ilgili bir plan yaparken"
  }
];