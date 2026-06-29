import { useCallback, useState } from 'react'
import { focusFirstFieldError, mergeInputClass } from '../utils/formValidation'

export function useFormValidation() {
  const [fieldErrors, setFieldErrors] = useState({})

  const clearFieldError = useCallback((field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const applyErrors = useCallback((errors) => {
    setFieldErrors(errors)
    focusFirstFieldError(errors)
  }, [])

  const clearAllErrors = useCallback(() => {
    setFieldErrors({})
  }, [])

  const inputClass = useCallback((field, baseClass = 'medcare-input') => {
    return mergeInputClass(baseClass, Boolean(fieldErrors[field]))
  }, [fieldErrors])

  return {
    fieldErrors,
    clearFieldError,
    applyErrors,
    clearAllErrors,
    inputClass,
    hasErrors: Object.keys(fieldErrors).length > 0,
  }
}
