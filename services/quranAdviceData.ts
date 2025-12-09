
export interface QuranAdvice {
  id: string;
  category: string;
  text: string;
  source: string; // Sure ve Ayet No
  context: string; // Hangi durumda hatırlanmalı
}

export const quranAdviceList: QuranAdvice[] = [
  {
    id: 'speech_kindness',
    category: 'İletişim',
    text: "Kullarıma söyle, sözün en güzelini söylesinler. Çünkü şeytan aralarını bozar.",
    source: "İsrâ Suresi, 53. Ayet",
    context: "Biriyle konuşurken veya tartışırken"
  },
  {
    id: 'anger_management',
    category: 'Öfke Kontrolü',
    text: "O takva sahipleri ki, bollukta da darlıkta da Allah için harcarlar; öfkelerini yutarlar ve insanları affederler. Allah da güzel davranışta bulunanları sever.",
    source: "Âl-i İmrân Suresi, 134. Ayet",
    context: "Öfkelendiğin ve sabrının taştığı anlarda"
  },
  {
    id: 'gossip_avoidance',
    category: 'Sosyal İlişkiler',
    text: "Ey iman edenler! Zannın çoğundan sakının; çünkü bazı zanlar günahtır. Birbirinizin kusurunu araştırmayın, kimse kimseyi çekiştirmesin.",
    source: "Hucurât Suresi, 12. Ayet",
    context: "Başkası hakkında konuşulurken veya şüpheye düşüldüğünde"
  },
  {
    id: 'humility',
    category: 'Tevazu',
    text: "Yeryüzünde böbürlenerek yürüme. Çünkü sen yeri asla yaramazsın, boyca da dağlara asla erişemezsin.",
    source: "İsrâ Suresi, 37. Ayet",
    context: "Kendini başkalarından üstün gördüğünde"
  },
  {
    id: 'justice_fairness',
    category: 'Adalet',
    text: "Ey iman edenler! Adaleti titizlikle ayakta tutan, kendiniz, ana-babanız ve akrabanız aleyhinde de olsa Allah için şahitlik eden kimseler olun.",
    source: "Nisâ Suresi, 135. Ayet",
    context: "Bir karar verirken veya taraf tutman gerektiğinde"
  },
  {
    id: 'patience_hardship',
    category: 'Zorluklarla Mücadele',
    text: "Ey iman edenler! Sabır ve namazla Allah'tan yardım dileyin. Şüphesiz Allah sabredenlerin yanındadır.",
    source: "Bakara Suresi, 153. Ayet",
    context: "Hayat zorlaştığında ve çaresiz hissettiğinde"
  },
  {
    id: 'good_evil_response',
    category: 'Kötülüğe Karşılık',
    text: "İyilikle kötülük bir olmaz. Sen kötülüğü en güzel bir şekilde sav. O zaman seninle arasında düşmanlık bulunan kimse, sanki candan bir dost olur.",
    source: "Fussilet Suresi, 34. Ayet",
    context: "Sana haksızlık veya kabalık yapıldığında"
  },
  {
    id: 'verification',
    category: 'Doğruluk',
    text: "Hakkında bilgin olmayan şeyin ardına düşme. Çünkü kulak, göz ve kalp, bunların hepsi ondan sorumludur.",
    source: "İsrâ Suresi, 36. Ayet",
    context: "Emin olmadığın bir haberi duyduğunda veya paylaşacağında"
  },
  {
    id: 'family_kindness',
    category: 'Aile',
    text: "Rabbin, kendisinden başkasına kulluk etmemenizi ve ana-babaya iyilik etmenizi emretti. Onlardan biri veya her ikisi senin yanında yaşlanırlarsa, onlara 'öf' bile deme!",
    source: "İsrâ Suresi, 23. Ayet",
    context: "Anne ve babanla ilişkilerinde"
  },
  {
    id: 'trust_allah',
    category: 'Tevekkül',
    text: "Bir işe azmettiğin zaman artık Allah'a güvenip dayan. Şüphesiz Allah, kendisine güvenip dayananları sever.",
    source: "Âl-i İmrân Suresi, 159. Ayet",
    context: "Bir karar verip harekete geçtiğinde"
  },
  {
    id: 'moderation',
    category: 'Denge',
    text: "Yürüyüşünde tabiî ol. Sesini alçalt. Çünkü seslerin en çirkini, şüphesiz eşeklerin sesidir.",
    source: "Lokmân Suresi, 19. Ayet",
    context: "Toplum içinde davranışlarında ve konuşmanda"
  },
  {
    id: 'forgiveness',
    category: 'Affedicilik',
    text: "Affı seç, iyiliği emret ve cahillerden yüz çevir.",
    source: "A'râf Suresi, 199. Ayet",
    context: "Cahilce davranışlara maruz kaldığında"
  }
];
