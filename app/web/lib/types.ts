export type Post = {
  id?: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  image_url?: string | null;

  // NOVOS CAMPOS
  status?: 'draft' | 'published';
  places?: string[]; // ex.: ['trending','featured','hero']

  created_at?: string;
  updated_at?: string;
};
