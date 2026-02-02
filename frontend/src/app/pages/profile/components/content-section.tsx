import { Separator } from '@/components/ui/separator'

interface ContentSectionProps {
  title: string
  desc: string
  children: JSX.Element
}

export default function ContentSection({
  title,
  desc,
  children,
}: ContentSectionProps) {
  return (
    <div className='mb-6 flex flex-1 flex-col rounded-lg border p-4'>
      <div className='flex-none'>
        <h3 className='text-lg font-medium'>{title}</h3>
        <p className='text-sm text-muted-foreground'>{desc}</p>
      </div>
      {title && <Separator className='my-4 flex-none' />}
      <div className='-mx-4 flex-1 overflow-auto scroll-smooth px-4 md:pb-4'>
        <div>{children}</div>
      </div>
    </div>
  )
}
