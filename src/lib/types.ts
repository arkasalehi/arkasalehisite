export type Role = "USER" | "ADMIN";
export type PostType = "BLOG" | "VIDEO" | "SHORT";
export type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type CommentStatus = "VISIBLE" | "HIDDEN" | "SPAM";
export type NotificationType = "LIKE" | "COMMENT" | "REPLY" | "NEW_CONTENT";
export type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELLED";

export type Profile = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: Role;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { posts: number };
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  comparePrice: number | null;
  discountPercent: number;
  stock: number;
  imageUrl: string | null;
  inStock: boolean;
  sku: string | null;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PostProduct = {
  postId: string;
  productId: string;
  product: Product;
};

export type AuthorLite = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

export type PublicPost = {
  id: string;
  type: PostType;
  status: PostStatus;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  coverImage: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  readingTime: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  featured: boolean;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  viewCount: number;
  categoryId: string | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  category: Category | null;
  author: AuthorLite;
  products: PostProduct[];
  _count: { likes: number; comments: number; bookmarks: number };
};

export type CommentUser = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

export type VisibleComment = {
  id: string;
  body: string;
  status: CommentStatus;
  postId: string;
  userId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: CommentUser;
  replies: Array<{
    id: string;
    body: string;
    status: CommentStatus;
    postId: string;
    userId: string;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: CommentUser;
  }>;
};

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  actorId: string | null;
  postId: string | null;
  groupKey: string | null;
  count: number;
  createdAt: Date;
};
