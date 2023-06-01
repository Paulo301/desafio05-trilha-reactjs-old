import { GetStaticProps } from 'next';

import { getPrismicClient } from '../services/prismic';
import Link from "next/link";

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import { PrismicDocument } from '@prismicio/types';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

function formatPost(post: PrismicDocument) {
  return {
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    }
  };
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPageLink, setNextPageLink] = useState<string | null>(postsPagination.next_page);

  function fetchMorePosts() {
    if(nextPageLink) {
      fetch(nextPageLink)
        .then(response => response.json())
        .then(data => {
          setPosts(posts => [...posts, ...data.results.map((post) => {
            return formatPost(post);
          })]);
          setNextPageLink(data.next_page);
        });
    }
  }

  return (
    <main className={commonStyles.container}>
      <div className={styles.posts}>
        {posts.map((post) => (
          <Link 
            href={`/post/${post.uid}`} 
            key={post.uid}
          >
            <a>
              <strong>{post.data.title}</strong>
              <p>{post.data.subtitle}</p>
              <div>
                <FiCalendar size={20} /> <time>{format(
                  new Date(post.first_publication_date),
                  "dd MMM yyyy",
                  {
                    locale: ptBR,
                  }
                )}</time>
                <FiUser size={20} /> <span>{post.data.author}</span>
              </div>
            </a>
          </Link>
        ))}
      </div>

      {nextPageLink && (
        <button onClick={fetchMorePosts}>Carregar mais posts</button>
      )}
    </main>
  );
}


export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', {
    pageSize: 2
  });
  
  const posts = postsResponse.results.map((post) => {
    return formatPost(post);
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts
      }
    },
    redirect: 60 * 30 //30min
  };
}