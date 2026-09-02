import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const db = new PrismaClient();

const SAMPLE_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
const SAMPLE_SHORT = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@arkasalehi.ir";
  const userEmail = process.env.SEED_USER_EMAIL ?? "user@arkasalehi.ir";

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      username: "arka",
      displayName: "آرکا صالحی",
      passwordHash: await hashPassword(process.env.SEED_ADMIN_PASSWORD ?? "Admin123!"),
      role: "ADMIN",
      bio: "خالق این پلتفرم. فقط من محتوا منتشر می‌کنم.",
    },
  });

  const user = await db.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      email: userEmail,
      username: "viewer",
      displayName: "کاربر نمونه",
      passwordHash: await hashPassword(process.env.SEED_USER_PASSWORD ?? "User123!"),
      role: "USER",
    },
  });

  const design = await db.category.upsert({
    where: { slug: "design" },
    update: {},
    create: { name: "طراحی", slug: "design", description: "مینیمالیسم، محصول و تجربه کاربری" },
  });
  const studio = await db.category.upsert({
    where: { slug: "studio" },
    update: {},
    create: { name: "استودیو", slug: "studio", description: "پشت‌صحنه و ساخت محتوا" },
  });

  const notebook = await db.product.upsert({
    where: { slug: "design-notebook" },
    update: {},
    create: {
      title: "دفترچه طراحی آرکا",
      slug: "design-notebook",
      description: "دفترچه محدود برای ایده‌پردازی روزانه.",
      price: 390_000,
      comparePrice: 490_000,
      imageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
      featured: true,
      sku: "NB-001",
    },
  });

  const mentorship = await db.product.upsert({
    where: { slug: "mentorship" },
    update: {},
    create: {
      title: "جلسه منتورشیپ",
      slug: "mentorship",
      description: "یک جلسه خصوصی برای معماری محصول محتوا.",
      price: 2_400_000,
      imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
      featured: true,
      sku: "MN-001",
    },
  });

  const blog1 = await db.post.upsert({
    where: { slug: "minimal-product-design" },
    update: {},
    create: {
      type: "BLOG",
      status: "PUBLISHED",
      title: "چرا مینیمالیسم در محصول جواب می‌دهد",
      slug: "minimal-product-design",
      excerpt: "کمتر، واضح‌تر، سریع‌تر. این یادداشت درباره تصمیم‌های طراحی است که بار شناختی را کم می‌کنند.",
      body: "محصول خوب شلوغ نیست. هر سطح شیشه‌ای، هر گرادیان و هر انیمیشن باید یک کار مشخص انجام دهد.\n\nدر این پلتفرم فقط یک خالق محتوا وجود دارد. این محدودیت عمدی است: تمرکز روی کیفیت انتشار، نه رقابت برای توجه.\n\nاگر در حال ساخت تجربه فارسی راست‌به‌چپ هستید، فاصله‌گذاری، وزن فونت و کنتراست مهم‌تر از تزئین است.",
      coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80",
      seoTitle: "مینیمالیسم در طراحی محصول",
      seoDescription: "چطور با کم کردن المان‌ها، محصول محتوایی سریع‌تر و خواناتر می‌سازیم.",
      publishedAt: new Date(),
      readingTime: 4,
      categoryId: design.id,
      authorId: admin.id,
      products: { create: [{ productId: notebook.id }] },
    },
  });

  await db.post.upsert({
    where: { slug: "portable-architecture" },
    update: {},
    create: {
      type: "BLOG",
      status: "PUBLISHED",
      title: "معماری portable: از کلودفلر تا سرور خودتان",
      slug: "portable-architecture",
      excerpt: "لایه دیتابیس و احراز هویت را از APIهای اختصاصی ابر جدا کنید تا بعداً روی Node.js هم اجرا شود.",
      body: "قفل‌شدن به یک ارائه‌دهنده معمولاً از لایه داده شروع می‌شود. اگر کوئری‌ها پشت یک factory باشند، بعداً Prisma را روی Postgres معمولی یا Accelerate عوض می‌کنید بدون اینکه صفحه و API عوض شود.\n\nهمین اصل برای آپلود ویدیو هم صدق می‌کند: URL را ذخیره کنید، نه باینری را روی فایل‌سیستم لوکال.",
      coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=80",
      publishedAt: new Date(),
      readingTime: 5,
      categoryId: studio.id,
      authorId: admin.id,
      products: { create: [{ productId: mentorship.id }] },
    },
  });

  await db.post.upsert({
    where: { slug: "studio-session" },
    update: {},
    create: {
      type: "VIDEO",
      status: "PUBLISHED",
      title: "پشت‌صحنه یک جلسه استودیو",
      slug: "studio-session",
      excerpt: "نور، صدا و ریتم تدوین برای ویدیوی فارسی.",
      videoUrl: SAMPLE_VIDEO,
      thumbnailUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=80",
      coverImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=80",
      duration: 90,
      publishedAt: new Date(),
      categoryId: studio.id,
      authorId: admin.id,
    },
  });

  await db.post.upsert({
    where: { slug: "glass-ui-pass" },
    update: {},
    create: {
      type: "VIDEO",
      status: "PUBLISHED",
      title: "یک پاس کوتاه روی UI شیشه‌ای",
      slug: "glass-ui-pass",
      excerpt: "گرادیان آبی/فیروزه‌ای بدون شلوغی.",
      videoUrl: SAMPLE_VIDEO,
      thumbnailUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80",
      coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80",
      duration: 75,
      publishedAt: new Date(),
      categoryId: design.id,
      authorId: admin.id,
    },
  });

  await db.post.upsert({
    where: { slug: "one-rule" },
    update: {},
    create: {
      type: "SHORT",
      status: "PUBLISHED",
      title: "یک قانون برای انتشار",
      slug: "one-rule",
      excerpt: "اگر ارزش ندارد، منتشر نکن.",
      videoUrl: SAMPLE_SHORT,
      thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80",
      duration: 18,
      publishedAt: new Date(),
      categoryId: studio.id,
      authorId: admin.id,
    },
  });

  await db.post.upsert({
    where: { slug: "rtl-spacing" },
    update: {},
    create: {
      type: "SHORT",
      status: "PUBLISHED",
      title: "فاصله در رابط راست‌به‌چپ",
      slug: "rtl-spacing",
      excerpt: "فضای منفی را جدی بگیرید.",
      videoUrl: SAMPLE_SHORT,
      thumbnailUrl: "https://images.unsplash.com/photo-1618005198919-d3d2249c7c5b?auto=format&fit=crop&w=900&q=80",
      duration: 15,
      publishedAt: new Date(),
      categoryId: design.id,
      authorId: admin.id,
    },
  });

  await db.comment.create({
    data: {
      postId: blog1.id,
      userId: user.id,
      body: "جمع‌بندی تمیزی بود؛ مخصوصاً بخش تمرکز روی یک خالق.",
    },
  });

  await db.notification.create({
    data: {
      userId: admin.id,
      type: "COMMENT",
      title: "نظر جدید",
      body: "کاربر نمونه روی مقاله مینیمالیسم نظر گذاشت",
      link: "/blog/minimal-product-design",
      actorId: user.id,
      postId: blog1.id,
    },
  });

  console.log("Seed complete.");
  console.log(`Admin: ${adminEmail}`);
  console.log(`User:  ${userEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
