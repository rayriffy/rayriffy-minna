import React, { useEffect, useState, useRef } from 'react'

import { GetStaticProps, NextPage } from 'next'
import Head from 'next/head'

import { useViewportSize } from 'web-api-hooks'

interface APIResult<T = unknown> {
  status: 'success' | 'failed'
  data: T
}

interface GeneratedFigure {
  id: string
  file: string
  image: {
    width: number
    height: number
  }
  position?: {
    width: number
    height: number
  }
}

interface Props {
  intitialRiffy: GeneratedFigure
}

const Page: NextPage<Props> = props => {
  const { intitialRiffy } = props

  const [width, height] = useViewportSize()

  const [figures, setFigures] = useState<GeneratedFigure[]>([])

  const handleRender = async (width: number, height: number) => {
    const res: APIResult<GeneratedFigure[]> = await fetch(`/api/generate`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        width,
        height,
      }),
    }).then(o => o.json())

    setFigures(res.data)
  }

  const mounted = useRef(false)
  useEffect(() => {
    const delay = 500

    const handler = setTimeout(() => {
      handleRender(width, height)
    }, delay)

    if (!mounted.current) {
      clearTimeout(handler)
      handleRender(width, height)
      mounted.current = true
    }

    return () => clearTimeout(handler)
  }, [width, height])

  return (
    <React.Fragment>
      <Head>
        <link rel="preload" as="image" href={`/static/${intitialRiffy.file}`} />
      </Head>
      <main className="bg-gray-50 h-full relative overflow-hidden flex justify-center items-center">
        <img
          key={`figure-intitial-${intitialRiffy.id}`}
          src={`/static/${intitialRiffy.file}`}
          width={`${Math.floor(intitialRiffy.image.width / 2)}`}
          height="auto"
        />
        {figures.map(figure => (
          <img
            key={`figure-${figure.id}`}
            src={`/static/${figure.file}`}
            width={`${Math.floor(figure.image.width / 2)}`}
            height="auto"
            style={{
              position: 'absolute',
              left: figure.position.width,
              top: figure.position.height,
            }}
          />
        ))}
      </main>
    </React.Fragment>
  )
}

export const getServerSideProps: GetStaticProps<Props> = async context => {
  const { nanoid } = await import('nanoid')
  const { sample } = await import('lodash')
  const { figures } = await import('../core/constants/figures')

  const targetFigure = sample(figures)

  return {
    props: {
      intitialRiffy: {
        id: nanoid(),
        file: targetFigure.file,
        image: {
          width: targetFigure.width,
          height: targetFigure.height,
        },
      },
    },
  }
}

export default Page
