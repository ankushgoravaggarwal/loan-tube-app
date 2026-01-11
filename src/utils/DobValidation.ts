export interface DOBValidationResult {
  formattedDob: string;
  dateOfBirth: string; // YYYY-MM-DD
  validationError: string;
  newCursorPosition?: number; // Optional, for cursor positioning after formatting
}

export const validateAndFormatDOB = (
  input: string,
  cursorPosition: number
): DOBValidationResult => {
  let formatted = '';
  let day = '';
  let month = '';
  let year = '';
  let validationError = '';
  let finalDateOfBirth = '';
  let newPosition = cursorPosition;

  // Remove any extra spaces or slashes (keep only digits)
  const digitsOnly = input.replace(/[^\d]/g, '');

  if (digitsOnly.length > 0) {
    // Add day (limit to 31)
    day = digitsOnly.substring(0, 2);
    if (day.length === 2 && parseInt(day) > 31) {
      day = '31';
    }
    formatted = day;

    // Add first slash if day has 2 digits
    if (day.length === 2) {
      formatted += ' / ';
    }

    // Add month (limit to 12)
    if (digitsOnly.length > 2) {
      month = digitsOnly.substring(2, 4);
      if (month.length === 2 && parseInt(month) > 12) {
        month = '12';
      }
      formatted += month;

      // Add second slash if month has 2 digits
      if (month.length === 2) {
        formatted += ' / ';
      }

      // Handle invalid dates like 31/04 (April has 30 days)
      if (day.length === 2 && month.length === 2) {
        const dayNum = parseInt(day);
        const monthNum = parseInt(month);

        // Check for months with 30 days
        if ([4, 6, 9, 11].includes(monthNum) && dayNum > 30) {
          day = '30';
          formatted = day + ' / ' + month;
          if (month.length === 2) {
            formatted += ' / ';
          }
        }

        // Check for February
        if (monthNum === 2) {
          // Default to 29 days max (leap year logic handled later)
          if (dayNum > 29) {
            day = '29';
            formatted = day + ' / ' + month;
            if (month.length === 2) {
              formatted += ' / ';
            }
          }
        }
      }
    }

    // Add year
    if (digitsOnly.length > 4) {
      year = digitsOnly.substring(4, 8); // Always get 4 digits for year
      formatted += year;

      // Handle February 29 in non-leap years
      if (day === '29' && month === '02' && year.length === 4) {
        const yearNum = parseInt(year);
        // Check if it's not a leap year
        if (yearNum % 4 !== 0 || (yearNum % 100 === 0 && yearNum % 400 !== 0)) {
          day = '28';
          formatted = day + ' / ' + month + ' / ' + year;
        }
      }
    }
  }

  // Combined value to save in the state
  const combinedInput = day + month + year;

  if (combinedInput.length === 8) {
    // Check year range (must be between 1900 and current year)
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();

    if (yearNum < 1900 || yearNum > currentYear) {
      validationError = `Age should be between 18 and 100.`;
      finalDateOfBirth = '';
      return { formattedDob: formatted, dateOfBirth: finalDateOfBirth, validationError, newCursorPosition: newPosition };
    }

    // Store in standard format YYYY-MM-DD
    const isoFormat = `${year}-${month}-${day}`;

    // Verify it's a valid date
    try {
      const validDate = new Date(isoFormat);
      const now = new Date();

      // Check the date is valid (JS dates like Feb 31 silently convert)
      const actualMonth = validDate.getMonth() + 1; // JS months are 0-indexed
      if (parseInt(month) !== actualMonth) {
        validationError = 'Please enter a valid date.';
        finalDateOfBirth = '';
        return { formattedDob: formatted, dateOfBirth: finalDateOfBirth, validationError, newCursorPosition: newPosition };
      }

      // Calculate age
      const ageDiff = now.getFullYear() - validDate.getFullYear();
      const hasHadBirthday =
        now.getMonth() > validDate.getMonth() ||
        (now.getMonth() === validDate.getMonth() && now.getDate() >= validDate.getDate());
      const age = hasHadBirthday ? ageDiff : ageDiff - 1;

      // Validate age - must be between 18 and 100
      if (age < 18) {
        validationError = 'You must be at least 18 years old to apply.';
        finalDateOfBirth = '';
        return { formattedDob: formatted, dateOfBirth: finalDateOfBirth, validationError, newCursorPosition: newPosition };
      }

      if (age > 100) {
        validationError = 'Age should be between 18 and 100.';
        finalDateOfBirth = '';
        return { formattedDob: formatted, dateOfBirth: finalDateOfBirth, validationError, newCursorPosition: newPosition };
      }

      // Save valid date
      finalDateOfBirth = isoFormat;
    } catch (e) {
      validationError = 'Please enter a valid date.';
      finalDateOfBirth = '';
    }
  } else {
    // Clear date of birth if incomplete
    finalDateOfBirth = '';
  }

  // Calculate new cursor position
  if (cursorPosition === 2 && day.length === 2) {
    newPosition = 5;
  } else if (cursorPosition === 5 && month.length === 2) {
    newPosition = 10;
  } else {
    if (cursorPosition > 2 && day.length === 2) newPosition += 3;
    if (cursorPosition > 4 && month.length === 2) newPosition += 3;
  }

  return { formattedDob: formatted, dateOfBirth: finalDateOfBirth, validationError, newCursorPosition: Math.min(newPosition, formatted.length) };
};

export const handleDOBBackspace = (
  e: React.KeyboardEvent<HTMLInputElement>,
  displayDOB: string,
  handleDOBChange: (event: React.ChangeEvent<HTMLInputElement>) => void
) => {
  // Only handle backspace
  if (e.key !== 'Backspace') return;

  const input = e.currentTarget;
  const cursorPosition = input.selectionStart || 0;

  // If text is selected, let default behavior handle it
  if ((input.selectionEnd || 0) - cursorPosition > 0) return;

  // Handle backspace at positions after slashes
  if (cursorPosition === 5 || cursorPosition === 10) {
    e.preventDefault();

    // Extract all digits
    const allDigits = displayDOB.replace(/[^\d]/g, '');

    // Calculate which digit to remove
    let updatedDigits = allDigits;
    const digitPos = cursorPosition === 5 ? 1 : 3; // Position of digit to remove

    // Remove the target digit
    if (allDigits.length > digitPos) {
      updatedDigits = allDigits.slice(0, digitPos) + allDigits.slice(digitPos + 1);
    }

    // Update with new value and move cursor
    const newPosition = cursorPosition - 3;
    const syntheticEvent = {
      target: { value: updatedDigits }
    } as React.ChangeEvent<HTMLInputElement>;

    handleDOBChange(syntheticEvent);
    setTimeout(() => input.setSelectionRange(newPosition, newPosition), 0);
  }
  // Handle regular backspace at other positions
  else if (cursorPosition > 0) {
    // Only intercept if we're not at the end of the input
    if (cursorPosition < displayDOB.length) {
      e.preventDefault();

      // Extract digits and map cursor position
      const allDigits = displayDOB.replace(/[^\d]/g, '');
      let digitPosition = cursorPosition;

      // Adjust for formatting characters
      if (cursorPosition > 5) digitPosition -= 3;
      if (cursorPosition > 10) digitPosition -= 3;

      // Remove the digit before cursor in digits-only string
      if (digitPosition > 0 && digitPosition <= allDigits.length) {
        const updatedDigits = allDigits.slice(0, digitPosition - 1) + allDigits.slice(digitPosition);

        // Create synthetic event with modified value
        const syntheticEvent = {
          target: { value: updatedDigits }
        } as React.ChangeEvent<HTMLInputElement>;

        handleDOBChange(syntheticEvent);

        // Calculate new cursor position
        let newPos = cursorPosition - 1;
        // If we deleted a digit right before a slash, move back more
        if (cursorPosition === 6 || cursorPosition === 11) newPos -= 3;

        setTimeout(() => input.setSelectionRange(newPos, newPos), 0);
      }
    }
  }
};
