import React from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/custom/breadcrumb'
type BreadcrumbItemType = {
  href?: string
  label?: string
  icon?: React.ReactNode
}
type BreadcrumbNavigationProps = {
  items: BreadcrumbItemType[]
}

export function BreadcrumbNavigation({ items }: BreadcrumbNavigationProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {item.href ? (
              <BreadcrumbItem>
                <BreadcrumbLink to={item.href}>
                  {item.icon ? item.icon : item.label}
                </BreadcrumbLink>
              </BreadcrumbItem>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbPage className='font-semibold'>
                  {item.label}
                </BreadcrumbPage>
              </BreadcrumbItem>
            )}
            {index < items.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
