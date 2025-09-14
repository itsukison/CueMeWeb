/**
 * Quick test script to verify Japanese document processing improvements
 */

// Test the JSON cleaning function
function testJsonCleaning() {
  console.log('🧪 Testing JSON cleaning function...')
  
  // Simulate the problematic JSON from logs
  const problematicJson = `{  "segments": [
    {      "content": "Senjin Holdings様\\n早稲田情報局",
      "type": "text",
      "pageNumber": 1,
      "role": "title"
    }    {      "content": "LightRoads",
      "type": "text",
      "pageNumber": 1
    }  ]}`
  
  // Test cleaning
  try {
    const cleaned = cleanJsonResponse(problematicJson)
    console.log('✅ Cleaned JSON:', cleaned)
    
    const parsed = JSON.parse(cleaned)
    console.log('✅ Parsed successfully:', parsed)
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

function cleanJsonResponse(responseText: string): string {
  let cleaned = responseText.trim()
  
  // Fix missing commas between objects - main issue
  cleaned = cleaned
    .replace(/}\s*{/g, '},{')
    .replace(/}\s*\n\s*{/g, '},\n    {')
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
  
  return cleaned.trim()
}

export { testJsonCleaning }