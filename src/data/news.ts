export type NewsItem = {
  id: string;
  title: string;
  category: string;
  source: string;
  timeAgo: string;
  image: string;
  excerpt?: string;
  isBreaking?: boolean;
  slug?: string;
};

// Image URLs from Unsplash (royalty-free)
const img = (id: string, w = 800, h = 500) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

export const heroNews: NewsItem[] = [
  {
    id: "h1",
    title: "الرئيس السيسي يفتتح المرحلة الثانية من العاصمة الإدارية الجديدة وسط حضور رسمي واسع",
    category: "سياسة",
    source: "القاهرة الكبرى",
    timeAgo: "منذ ساعة",
    image: img("photo-1539037116277-4db20889f2d4"),
    excerpt: "في خطوة تاريخية، شهد الرئيس عبد الفتاح السيسي مراسم افتتاح المرحلة الثانية من مشروع العاصمة الإدارية الجديدة بمشاركة عدد من رؤساء الدول العربية.",
    isBreaking: true,
  },
  {
    id: "h2",
    title: "البنك المركزي المصري يقرر تثبيت أسعار الفائدة في اجتماعه الأخير",
    category: "اقتصاد",
    source: "القاهرة الكبرى",
    timeAgo: "منذ 3 ساعات",
    image: img("photo-1611974789855-9c2a0a7236a3"),
  },
  {
    id: "h3",
    title: "محمد صلاح يقود ليفربول لاكتساح خصمه ويعزز صدارته للدوري الإنجليزي",
    category: "رياضة",
    source: "القاهرة الكبرى",
    timeAgo: "منذ 4 ساعات",
    image: img("photo-1431324155629-1a6deb1dec8d"),
  },
];

export const breakingItems: string[] = [
  "الأهلي يتحرك لتجديد عقود شوبير وكوكا وشروط الشحات تؤجل الاتفاق",
  "البورصة المصرية تغلق تعاملاتها على ارتفاع جماعي بقيادة EGX30",
  "وزير الصحة يعلن عن خطة جديدة لتطوير المستشفيات الحكومية",
  "ارتفاع جديد في أسعار الذهب بالأسواق المحلية",
  "مجلس النواب يوافق نهائياً على قانون مهنة المحاماة الجديد",
];

export const latestNews: NewsItem[] = [
  {
    id: "n1",
    title: "بالصور.. احتفالات صاخبة لجماهير أرسنال بعد التتويج بالدوري الإنجليزي",
    category: "رياضة",
    source: "القاهرة الكبرى",
    timeAgo: "منذ ساعتين",
    image: img("photo-1574629810360-7efbbe195018"),
  },
  {
    id: "n2",
    title: "حبس معلمة قتلت طفلة بغرض الانتقام من أسرتها في المنيا",
    category: "حوادث",
    source: "القاهرة الكبرى",
    timeAgo: "منذ 5 ساعات",
    image: img("photo-1589994965851-a8f479c573a9"),
  },
  {
    id: "n3",
    title: "ترامب يلوح بضربة جديدة لإيران ويقول إنه أرجأ الهجوم قبل ساعة من تنفيذه",
    category: "سياسة",
    source: "القاهرة الكبرى",
    timeAgo: "منذ 31 دقيقة",
    image: img("photo-1529107386315-e1a2ed48a620"),
  },
  {
    id: "n4",
    title: "هل ترفع مصر أسعار الوقود قبل يونيو المقبل؟ مسؤول حكومي يجيب",
    category: "اقتصاد",
    source: "القاهرة الكبرى",
    timeAgo: "منذ 6 ساعات",
    image: img("photo-1545459720-aac8509eb02c"),
  },
  {
    id: "n5",
    title: "أحمد العوضي عن تعاونه مع أحمد السقا: إحنا الاثنين وافقنا",
    category: "فن",
    source: "القاهرة الكبرى",
    timeAgo: "منذ 14 ساعة",
    image: img("photo-1485846234645-a62644f84728"),
  },
  {
    id: "n6",
    title: "حريق يلتهم سيارة ملاكي بطريق الإسكندرية الصحراوي",
    category: "حوادث",
    source: "القاهرة الكبرى",
    timeAgo: "منذ 6 ساعات",
    image: img("photo-1599689018034-48e2ead82951"),
  },
  {
    id: "n7",
    title: "إقرار مشروع قانون مهنة المحاماة الجديد بعد جدل واسع",
    category: "سياسة",
    source: "القاهرة الكبرى",
    timeAgo: "منذ 6 ساعات",
    image: img("photo-1505664194779-8beaceb93744"),
  },
  {
    id: "n8",
    title: "كادينا سير: رحيل جوارديولا يتسبب في انتقال لاعب مانشستر سيتي إلى ريال مدريد",
    category: "رياضة",
    source: "القاهرة الكبرى",
    timeAgo: "منذ 19 ساعة",
    image: img("photo-1551958219-acbc608c6377"),
  },
];

export const reports: NewsItem[] = [
  {
    id: "r1",
    title: "هل يبيح قانون الأسرة الجديد تجربة الزواج لمدة 6 أشهر؟ رئيس اللجنة يحسم الجدل",
    category: "تقارير",
    source: "القاهرة الكبرى",
    timeAgo: "منذ 8 ساعات",
    image: img("photo-1519225421980-715cb0215aed", 1200, 700),
    excerpt: "في حوار خاص، يكشف رئيس لجنة قانون الأسرة عن أبرز التعديلات المقترحة وموقفها من قضايا الزواج والطلاق.",
  },
];

export const opinions: NewsItem[] = [
  { id: "o1", title: "مستقبل الاقتصاد المصري بين تحديات الديون وفرص النمو", category: "آراء", source: "د. أحمد سعيد", timeAgo: "منذ يوم", image: img("photo-1507003211169-0a1dd7228f2d", 200, 200) },
  { id: "o2", title: "كرة القدم المصرية إلى أين؟ قراءة في موسم استثنائي", category: "آراء", source: "كابتن حسام البدري", timeAgo: "منذ يومين", image: img("photo-1494790108377-be9c29b29330", 200, 200) },
  { id: "o3", title: "التعليم في مصر: بين رؤية 2030 وواقع الفصول الدراسية", category: "آراء", source: "أ. منى الشاذلي", timeAgo: "منذ 3 أيام", image: img("photo-1438761681033-6461ffad8d80", 200, 200) },
];

export const gallery: { id: string; image: string; caption: string }[] = [
  { id: "g1", image: img("photo-1539650116574-75c0c6d73f6e", 600, 400), caption: "ليلة في القاهرة القديمة" },
  { id: "g2", image: img("photo-1568322445389-f64ac2515020", 600, 400), caption: "نهر النيل عند الغروب" },
  { id: "g3", image: img("photo-1572252009286-268acec5ca0a", 600, 400), caption: "الأهرامات في ضوء الفجر" },
  { id: "g4", image: img("photo-1583077874340-79db6564672e", 600, 400), caption: "أسواق خان الخليلي" },
];
