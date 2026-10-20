import { Kitchen } from '@/components/kitchen';
import { getCatalog } from '@/lib/catalog';
import { siteMetadata } from '@/lib/site-metadata';
export async function generateMetadata({ params }: { params: Promise<{ route?: string[] }> }) {
 const {route = []} = await params;
 const path = '/' + route.join('/');
 if ((route[0] === 'resep' || route[0] === 'masak') && route.length === 2) {
  const recipe = getCatalog().recipes.find(item => item.slug === route[1]);
  if (recipe) return siteMetadata(path, `${route[0] === 'masak' ? 'Memasak ' : ''}${recipe.title} | RasaNusantara`, `${recipe.title} dari ${recipe.origin}. Lihat bahan, sesuaikan porsi, dan ikuti langkah memasak bersama AI Teman Dapur.`);
 }
 const titles: Record<string,string> = {'/cari':'Cari masakan dari bahan','/hasil':'Rekomendasi masakan','/tentang':'Tentang RasaNusantara'};
 return titles[path] ? siteMetadata(path, `${titles[path]} | RasaNusantara`) : siteMetadata(path);
}
export default function Page() { return <Kitchen />; }
