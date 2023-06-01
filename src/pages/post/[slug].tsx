import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';
import { useRouter } from 'next/router';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { Fragment } from 'react';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  const words = post?.data.content.map((item) => {
    const headingWords = item.heading.split(' ');
    const bodyWords = item.body.map((par) => par.text.split(' ')).reduce((prev, next) => [...prev, ...next], []);

    return [...headingWords, ...bodyWords];
  }).reduce((prev, next) => [...prev, ...next], []);
  const minReading = words ? Math.floor(words.length/200)+(words.length%200 > 0 ? 1 : 0) : 0;

  if(router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <main>
      <img src={post.data.banner.url} alt='banner' className={styles.banner}/>
      <article className={`${commonStyles.container} ${styles.post}`}>
        <h1>{post.data.title}</h1>
        <div>
          <FiCalendar size={20} /><time>{format(new Date(post.first_publication_date || ''), "dd MMM yyyy",
            {
              locale: ptBR,
            }
          )}</time>
          <FiUser size={20} /><span>{post.data.author}</span>
          <FiClock size={20} /><span>{minReading} min</span>
        </div>
        {post.data.content.map((item) => (
          <Fragment key={item.heading}>
            <h2>{item.heading}</h2>
            <div 
              dangerouslySetInnerHTML={{ __html: RichText.asHtml(item.body) }}
            />
          </Fragment>
        ))}
      </article>
    </main>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');

  return {
    paths: posts.results.splice(0,2).map((post) => ({
      params: { slug: post.uid }
    })),
    fallback: true
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient({});

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url
      },
      author: response.data.author,
      content: response.data.content
    },
    uid: response.uid
  }

  return {
    props: {
      post
    },
    redirect: 60 * 30 //30min,
  };
}