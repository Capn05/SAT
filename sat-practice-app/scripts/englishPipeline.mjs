import OpenAI from 'openai';
import { supabase } from '../lib/supabase.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
// Initialize OpenAI and Supabase clients
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPEN_AI_API_KEY,
  dangerouslyAllowBrowser: true,
});
// Function to generate a question using OpenAI GPT
async function generateQuestion(prompt) {
  const structuredPrompt = `
  You are an expert SAT question creator. Please provide a question in JSON format with the following structure:

  {
    "passage": "Your passage here.",
    "question": "Your question here.",
    "options": [
      "These options should just be strings, not objects and theyre should be four of them",
      "These options should just be strings, not objects and theyre should be four of them",
      "These options should just be strings, not objects and theyre should be four of them",
      "These options should just be strings, not objects and theyre should be four of them",
    ],
    "correctOption": "strictly: A or B or C or D"
    "skill_knowledge":"the sub skill that the question is modeled after
  }

  Based on the following prompt: ${prompt}
  `;

  const response = await openai.chat.completions.create({
    model: "o1-mini",
    messages: [
      { role: "user", content: structuredPrompt },
    ],
  });

  console.log('Response from OpenAI:', response.choices[0].message.content);

  const generatedText = response.choices[0].message.content;

  // Clean up the generated text to remove any formatting
  const cleanedText = generatedText.replace(/```json|```/g, '').trim(); // Remove the backticks and 'json'

  // Parse the JSON response
  let questionData;
  try {
    questionData = JSON.parse(cleanedText);
    console.log('Parsed questionData:', questionData); // Log the parsed data
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    throw new Error(`Failed to parse JSON response: ${error.message}`);
  }

  return questionData; // Return the parsed JSON object
}

// Function to upload question and options to Supabase
async function uploadToSupabase(questionData) {
  // Prepare the question text
  let questionText = questionData.question; // Start with the question

  // Check if the passage exists and append it with a <br> if it does
  if (questionData.passage) {
    questionText = `${questionData.passage}<br>` + questionText; // Append the passage with a line break
  }

  // Insert question into the `questions` table
  const questionResponse = await supabase
    .from("official_questions")
    .insert([{
      question_text: questionText, // Use the modified question text
      image_url: null,
      difficulty: "medium",
      category: questionData.skill_knowledge, // Assuming this exists in questionData
      test_id: 1,
      subject_id: 2
    }])
    .select(); // Add this line to return the inserted data

  // Log the entire questionResponse object
  console.log("supabase response:", JSON.stringify(questionResponse, null, 2));

  if (questionResponse.error) {
    throw new Error(`Failed to insert question: ${questionResponse.error.message}`);
  }

  // Access the question ID from the response
  const questionId = questionResponse.data[0].id; // This should now work
  console.log("QUESTIONID" + questionId)
  // Insert options into the `options` table
  const optionLabels = ["A", "B", "C", "D"];
  const options = questionData.options.map((optionText, index) => ({
    question_id: questionId,
    value: optionLabels[index], // Set value to "A", "B", "C", or "D"
    label: optionText, // Assuming label is the same as the option text
    is_correct: optionLabels[index] === questionData.correctOption,
  }));

  const optionsResponse = await supabase.from("official_options").insert(options);

  if (optionsResponse.error) {
    throw new Error(`Failed to insert options: ${optionsResponse.error.message}`);
  }

  console.log(`Uploaded question: ${questionData.question}`);
}

// Main pipeline function
async function main() {
    
const questionData = {
    questions: [
    {
        type: "Information and Ideas",
        description: "Students will use comprehension, analysis, and reasoning skills and knowledge as well as what is stated and implied in texts (including in any accompanying informational graphics) to locate, interpret, evaluate, and integrate information and ideas.",
        subtypes: [
        {
            name: "Central Ideas and Details",
            description: "Students will determine the central idea of a text and/or interpret the key details supporting that idea.",
            Example:
                {
                    "passage": "To dye wool, Navajo (Diné) weaver Lillie Taylor uses plants and vegetables from Arizona, where she lives. For example, she achieved the deep reds and browns featured in her 2003 rug In the Path of the Four Seasons by using Arizona dock roots, drying and grinding them before mixing the powder with water to create a dye bath. To intensify the appearance of certain colors, Taylor also sometimes mixes in clay obtained from nearby soil.",
                    "question": "Which choice best states the main idea of the text?",
                    "options":
                    [
                        {
                        A:"Reds and browns are not commonly featured in most of Taylor’s rugs",
                        },
                        {
                        B: "In the Path of the Four Seasons is widely acclaimed for its many colors and innovative weaving techniques."
                        },
                        {
                        C: "Taylor draws on local resources in the approach she uses to dye wool."
                        },
                        {
                        D: "Taylor finds it difficult to locate Arizona dock root in the desert."
                        },           
                    ],
                    "correct answer": "C",
                    "skill_knowledge": "Central Ideas and Details",
                    "key_explanation": "Choice C is the best answer. The passage focuses on the idea that the artist Lillie Taylor uses resources such as plants and vegetables from where she lives in Arizona to make dyes for wool."
                },
        },
        {
          name: "Central Ideas and Details",
          description: "Students will determine the central idea of a text and/or interpret the key details supporting that idea.",
          Example:
              {
                  "passage": "To dye wool, Navajo (Diné) weaver Lillie Taylor uses plants and vegetables from Arizona, where she lives. For example, she achieved the deep reds and browns featured in her 2003 rug In the Path of the Four Seasons by using Arizona dock roots, drying and grinding them before mixing the powder with water to create a dye bath. To intensify the appearance of certain colors, Taylor also sometimes mixes in clay obtained from nearby soil.",
                  "question": "Which choice best states the main idea of the text?",
                  "options":
                  [
                      {
                      A:"Reds and browns are not commonly featured in most of Taylor’s rugs",
                      },
                      {
                      B: "In the Path of the Four Seasons is widely acclaimed for its many colors and innovative weaving techniques."
                      },
                      {
                      C: "Taylor draws on local resources in the approach she uses to dye wool."
                      },
                      {
                      D: "Taylor finds it difficult to locate Arizona dock root in the desert."
                      },           
                  ],
                  "correct answer": "C",
                  "skill_knowledge": "Central Ideas and Details",
                  "key_explanation": "Choice C is the best answer. The passage focuses on the idea that the artist Lillie Taylor uses resources such as plants and vegetables from where she lives in Arizona to make dyes for wool."
              },
      },
        
        {
            name: "Textual Evidence",
            description: "Students will determine the textual evidence (e.g., a fact, detail, or example from a text) that best supports a specified claim or point.",
            "Example": {
                "passage": "Jan Gimsa, Robert Sleigh, and Ulrike Gimsa have hypothesized that the sail-like structure running down the back of the dinosaur Spinosaurus aegyptiacus improved the animal’s success in underwater pursuits of prey species capable of making quick, evasive movements. To evaluate their hypothesis, a second team of researchers constructed two battery-powered mechanical models of S. aegyptiacus, one with a sail and one without, and subjected the models to a series of identical tests in a water-filled tank.",
                "question": "Which finding from the model tests, if true, would most strongly support Gimsa and colleagues’ hypothesis?",
                "options": [
                  { "A": "The model with a sail took significantly longer to travel a specified distance while submerged than the model without a sail did." },
                  { "B": "The model with a sail displaced significantly more water while submerged than the model without a sail did." },
                  { "C": "The model with a sail had significantly less battery power remaining after completing the tests than the model without a sail did." },
                  { "D": "The model with a sail took significantly less time to complete a sharp turn while submerged than the model without a sail did." }
                ],
                "correct answer": "D",
                "skill_knowledge": "Command of Evidence (Textual)",
                "key_explanation": "Choice D is the best answer. The passage states that Gimsa and colleagues’ hypothesis was that the sail-like structure on the back of S. aegyptiacus enhanced the dinosaur’s ability to travel underwater to hunt down 'prey species capable of making quick, evasive movements.' This choice’s finding would effectively support the hypothesis because it would indicate that the sail-like structure would enable a dinosaur moving underwater to maneuver more quickly than a dinosaur moving underwater without the structure."
              }

        },
        {
          name: "Textual Evidence",
          description: "Students will determine the textual evidence (e.g., a fact, detail, or example from a text) that best supports a specified claim or point.",
          "Example": {
              "passage": "Jan Gimsa, Robert Sleigh, and Ulrike Gimsa have hypothesized that the sail-like structure running down the back of the dinosaur Spinosaurus aegyptiacus improved the animal’s success in underwater pursuits of prey species capable of making quick, evasive movements. To evaluate their hypothesis, a second team of researchers constructed two battery-powered mechanical models of S. aegyptiacus, one with a sail and one without, and subjected the models to a series of identical tests in a water-filled tank.",
              "question": "Which finding from the model tests, if true, would most strongly support Gimsa and colleagues’ hypothesis?",
              "options": [
                { "A": "The model with a sail took significantly longer to travel a specified distance while submerged than the model without a sail did." },
                { "B": "The model with a sail displaced significantly more water while submerged than the model without a sail did." },
                { "C": "The model with a sail had significantly less battery power remaining after completing the tests than the model without a sail did." },
                { "D": "The model with a sail took significantly less time to complete a sharp turn while submerged than the model without a sail did." }
              ],
              "correct answer": "D",
              "skill_knowledge": "Command of Evidence (Textual)",
              "key_explanation": "Choice D is the best answer. The passage states that Gimsa and colleagues’ hypothesis was that the sail-like structure on the back of S. aegyptiacus enhanced the dinosaur’s ability to travel underwater to hunt down 'prey species capable of making quick, evasive movements.' This choice’s finding would effectively support the hypothesis because it would indicate that the sail-like structure would enable a dinosaur moving underwater to maneuver more quickly than a dinosaur moving underwater without the structure."
            }

      },
        {
            name: "Quantitative Evidence",
            description: "Students will determine the quantitative evidence (i.e., data from an informational graphic) that best supports a specified claim or point.",
            "Example": {
                "passage": "Participants’ Evaluation of the Likelihood That Robots Can Work Effectively in Different Occupations\n\nOccupation            Somewhat or very unlikely (%)   Neutral (%)   Somewhat or very likely (%)\ntelevision news anchor            24                            9                     67\nteacher                          37                           16                     47\nfirefighter                      62                            9                     30\nsurgeon                          74                            9                     16\ntour guide                       10                            8                     82\n\nRows in the table may not add up to 100 due to rounding.\n\nGeorgia Tech roboticists De’Aira Bryant and Ayanna Howard, along with ethicist Jason Borenstein, were interested in people’s perceptions of robots’ competence. They recruited participants and asked them how likely they think it is that a robot could do the work required in various occupations. Participants’ evaluations varied widely depending on which occupation was being considered; for example, ______",
                "question": "Which choice most effectively uses data from the table to complete the example?",
                "options": [
                  { "A": "82% of participants believe that it is somewhat or very likely that a robot could work effectively as a tour guide, but only 16% believe that it is somewhat or very likely that a robot could work as a surgeon." },
                  { "B": "47% of participants believe that it is somewhat or very likely that a robot could work effectively as a teacher, but 37% of respondents believe that it is somewhat or very unlikely that a robot could do so." },
                  { "C": "9% of participants were neutral about whether a robot could work effectively as a television news anchor, which is the same percent of participants who were neutral when asked about a robot working as a surgeon." },
                  { "D": "62% of participants believe that it is somewhat or very unlikely that a robot could work effectively as a firefighter." }
                ],
                "correct answer": "A",
                "skill_knowledge": "Command of Evidence (Quantitative)",
                "key_explanation": "Choice A is the best answer. It uses data from the table to provide a clear comparison between two occupations where perceptions of robots' effectiveness vary significantly. The example highlights the disparity in likelihood ratings, which aligns with the passage's emphasis on participants’ differing evaluations across occupations."
              }
        },
        {
            name: "Inferences",
            description: "Students will draw reasonable inferences based on explicit and/or implicit information and ideas in a text.",
            "Example": {
  "passage": "Many animals, including humans, must sleep, and sleep is known to have a role in everything from healing injuries to encoding information in long-term memory. But some scientists claim that, from an evolutionary standpoint, deep sleep for hours at a time leaves an animal so vulnerable that the known benefits of sleeping seem insufficient to explain why it became so widespread in the animal kingdom. These scientists therefore imply that ______",
  "question": "Which choice most logically completes the text?",
  "options": [
    { "A": "it is more important to understand how widespread prolonged deep sleep is than to understand its function." },
    { "B": "prolonged deep sleep is likely advantageous in ways that have yet to be discovered." },
    { "C": "many traits that provide significant benefits for an animal also likely pose risks to that animal." },
    { "D": "most traits perform functions that are hard to understand from an evolutionary standpoint." }
  ],
  "correct answer": "B",
  "skill_knowledge": "Inferences",
  "key_explanation": "Choice B is the best answer. The passage indicates that although scientists recognize that sleep, which is widespread among animal species, has benefits, some scientists believe that deep, prolonged sleep is so risky from the perspective of animal species’ survival and well-being that there must be some so-far-undiscovered advantage(s) to sleep to make it worthwhile from an evolutionary standpoint. Choice A is incorrect because the passage suggests that the extent of deep, prolonged sleep among animal species is well understood by scientists and that the real question for scientists is why so many animal species engage in deep, prolonged sleep. Choice C is incorrect because the passage offers no evidence that any trait other than deep, prolonged sleep poses both benefits and risks for animal species. Choice D is incorrect because the passage offers no evidence that any trait other than deep, prolonged sleep has one or more functions that are hard for scientists to understand."
}

        },
        {
          name: "Inferences",
          description: "Students will draw reasonable inferences based on explicit and/or implicit information and ideas in a text.",
          "Example": {
"passage": "Many animals, including humans, must sleep, and sleep is known to have a role in everything from healing injuries to encoding information in long-term memory. But some scientists claim that, from an evolutionary standpoint, deep sleep for hours at a time leaves an animal so vulnerable that the known benefits of sleeping seem insufficient to explain why it became so widespread in the animal kingdom. These scientists therefore imply that ______",
"question": "Which choice most logically completes the text?",
"options": [
  { "A": "it is more important to understand how widespread prolonged deep sleep is than to understand its function." },
  { "B": "prolonged deep sleep is likely advantageous in ways that have yet to be discovered." },
  { "C": "many traits that provide significant benefits for an animal also likely pose risks to that animal." },
  { "D": "most traits perform functions that are hard to understand from an evolutionary standpoint." }
],
"correct answer": "B",
"skill_knowledge": "Inferences",
"key_explanation": "Choice B is the best answer. The passage indicates that although scientists recognize that sleep, which is widespread among animal species, has benefits, some scientists believe that deep, prolonged sleep is so risky from the perspective of animal species’ survival and well-being that there must be some so-far-undiscovered advantage(s) to sleep to make it worthwhile from an evolutionary standpoint. Choice A is incorrect because the passage suggests that the extent of deep, prolonged sleep among animal species is well understood by scientists and that the real question for scientists is why so many animal species engage in deep, prolonged sleep. Choice C is incorrect because the passage offers no evidence that any trait other than deep, prolonged sleep poses both benefits and risks for animal species. Choice D is incorrect because the passage offers no evidence that any trait other than deep, prolonged sleep has one or more functions that are hard for scientists to understand."
}

      }
        ]
    },
    {
        type: "Craft and Structure",
        description: "Students will use comprehension, vocabulary, analysis, synthesis, and reasoning skills and knowledge to use and determine the meaning of high-utility academic words and phrases in context, evaluate texts rhetorically, and make supportable connections between multiple topically related texts.",
        subtypes: [
        {
            name: "Words in Context",
            description: "Students will determine the meaning of a high-utility academic word or phrase in context or use such vocabulary in a contextually appropriate way.",
            "Example": {
                "passage": "In recommending Bao Phi’s collection *Sông I Sing*, a librarian noted that pieces by the spoken-word poet don’t lose their ______ nature when printed: the language has the same pleasant musical quality on the page as it does when performed by Phi.",
                "question": "Which choice completes the text with the most logical and precise word or phrase?",
                "options": [
                  { "A": "jarring" },
                  { "B": "scholarly" },
                  { "C": "melodic" },
                  { "D": "personal" }
                ],
                "correct answer": "C",
                "skill_knowledge": "Words in Context",
                "key_explanation": "Choice C is the best answer. “Melodic,” referring to a pleasant arrangement of sounds, effectively signals the later use in the passage of “pleasant musical quality” to describe Phi’s spoken-word poetry when read rather than heard.",
                "distractor_explanations": [
                  { "A": "Choice A is incorrect because 'jarring,' meaning disagreeable or upsetting, suggests the opposite of what the passage says about the 'pleasant musical quality' of Phi’s spoken-word poetry, whether read or heard." },
                  { "B": "Choice B is incorrect because 'scholarly' does not effectively signal the later use in the passage of 'pleasant musical quality' to refer to Phi’s spoken-word poetry." },
                  { "D": "Choice D is incorrect because 'personal' does not effectively signal the later use in the passage of 'pleasant musical quality' to refer to Phi’s spoken-word poetry." }
                ]
              }
        },
        {
          name: "Words in Context",
          description: "Students will determine the meaning of a high-utility academic word or phrase in context or use such vocabulary in a contextually appropriate way.",
          "Example": {
              "passage": "In recommending Bao Phi’s collection *Sông I Sing*, a librarian noted that pieces by the spoken-word poet don’t lose their ______ nature when printed: the language has the same pleasant musical quality on the page as it does when performed by Phi.",
              "question": "Which choice completes the text with the most logical and precise word or phrase?",
              "options": [
                { "A": "jarring" },
                { "B": "scholarly" },
                { "C": "melodic" },
                { "D": "personal" }
              ],
              "correct answer": "C",
              "skill_knowledge": "Words in Context",
              "key_explanation": "Choice C is the best answer. “Melodic,” referring to a pleasant arrangement of sounds, effectively signals the later use in the passage of “pleasant musical quality” to describe Phi’s spoken-word poetry when read rather than heard.",
              "distractor_explanations": [
                { "A": "Choice A is incorrect because 'jarring,' meaning disagreeable or upsetting, suggests the opposite of what the passage says about the 'pleasant musical quality' of Phi’s spoken-word poetry, whether read or heard." },
                { "B": "Choice B is incorrect because 'scholarly' does not effectively signal the later use in the passage of 'pleasant musical quality' to refer to Phi’s spoken-word poetry." },
                { "D": "Choice D is incorrect because 'personal' does not effectively signal the later use in the passage of 'pleasant musical quality' to refer to Phi’s spoken-word poetry." }
              ]
            }
      },
        {
            name: "Text Structure and Purpose",
            description: "Students will analyze the structure of a text or determine the main rhetorical purpose of a text.",
            "Example": {
                "passage": "Some studies have suggested that posture can influence cognition, but we should not overstate this phenomenon. A case in point: In a 2014 study, Megan O’Brien and Alaa Ahmed had subjects stand or sit while making risky simulated economic decisions. Standing is more physically unstable and cognitively demanding than sitting; accordingly, O’Brien and Ahmed hypothesized that standing subjects would display more risk aversion during the decision-making tasks than sitting subjects did, since they would want to avoid further feelings of discomfort and complicated risk evaluations. But O’Brien and Ahmed actually found no difference in the groups’ performance.",
                "question": "Which choice best states the main purpose of the text?",
                "options": [
                  { "A": "It presents the study by O’Brien and Ahmed to critique the methods and results reported in previous studies of the effects of posture on cognition." },
                  { "B": "It argues that research findings about the effects of posture on cognition are often misunderstood, as in the case of O’Brien and Ahmed’s study." },
                  { "C": "It explains a significant problem in the emerging understanding of posture’s effects on cognition and how O’Brien and Ahmed tried to solve that problem." },
                  { "D": "It discusses the study by O’Brien and Ahmed to illustrate why caution is needed when making claims about the effects of posture on cognition." }
                ],
                "correct answer": "D",
                "skill_knowledge": "Text Structure and Purpose",
                "key_explanation": "Choice D is the best answer. The passage asserts that 'we should not overstate' the effect of posture on cognition and uses the O’Brien and Ahmed study as a 'case in point' in support of that claim.",
                "distractor_explanations": [
                  { "A": "Choice A is incorrect because although the passage indicates that O’Brien and Ahmed reached different conclusions from those of other researchers, it does not use the O’Brien and Ahmed study to criticize how those earlier studies were conducted or to directly challenge the accuracy of those studies’ results." },
                  { "B": "Choice B is incorrect because although the passage indicates that the results from studies finding a link between posture and cognition have been overstated, it offers no evidence that the O’Brien and Ahmed study has often been misunderstood." },
                  { "C": "Choice C is incorrect because the passage suggests that although O’Brien and Ahmed were interested in studying the matter of posture and cognition, it does not indicate what these researchers thought before conducting their study or that the researchers set out specifically to solve a problem." }
                ]
              }
        },
        {
          name: "Text Structure and Purpose",
          description: "Students will analyze the structure of a text or determine the main rhetorical purpose of a text.",
          "Example": {
              "passage": "Some studies have suggested that posture can influence cognition, but we should not overstate this phenomenon. A case in point: In a 2014 study, Megan O’Brien and Alaa Ahmed had subjects stand or sit while making risky simulated economic decisions. Standing is more physically unstable and cognitively demanding than sitting; accordingly, O’Brien and Ahmed hypothesized that standing subjects would display more risk aversion during the decision-making tasks than sitting subjects did, since they would want to avoid further feelings of discomfort and complicated risk evaluations. But O’Brien and Ahmed actually found no difference in the groups’ performance.",
              "question": "Which choice best states the main purpose of the text?",
              "options": [
                { "A": "It presents the study by O’Brien and Ahmed to critique the methods and results reported in previous studies of the effects of posture on cognition." },
                { "B": "It argues that research findings about the effects of posture on cognition are often misunderstood, as in the case of O’Brien and Ahmed’s study." },
                { "C": "It explains a significant problem in the emerging understanding of posture’s effects on cognition and how O’Brien and Ahmed tried to solve that problem." },
                { "D": "It discusses the study by O’Brien and Ahmed to illustrate why caution is needed when making claims about the effects of posture on cognition." }
              ],
              "correct answer": "D",
              "skill_knowledge": "Text Structure and Purpose",
              "key_explanation": "Choice D is the best answer. The passage asserts that 'we should not overstate' the effect of posture on cognition and uses the O’Brien and Ahmed study as a 'case in point' in support of that claim.",
              "distractor_explanations": [
                { "A": "Choice A is incorrect because although the passage indicates that O’Brien and Ahmed reached different conclusions from those of other researchers, it does not use the O’Brien and Ahmed study to criticize how those earlier studies were conducted or to directly challenge the accuracy of those studies’ results." },
                { "B": "Choice B is incorrect because although the passage indicates that the results from studies finding a link between posture and cognition have been overstated, it offers no evidence that the O’Brien and Ahmed study has often been misunderstood." },
                { "C": "Choice C is incorrect because the passage suggests that although O’Brien and Ahmed were interested in studying the matter of posture and cognition, it does not indicate what these researchers thought before conducting their study or that the researchers set out specifically to solve a problem." }
              ]
            }
      },
        {
            name: "Cross-Text Connections",
            description: "Students will draw reasonable connections between two texts on related topics.",
            "Example": {
                "text_1": "What factors influence the abundance of species in a given ecological community? Some theorists have argued that historical diversity is a major driver of how diverse an ecological community eventually becomes: differences in community diversity across otherwise similar habitats, in this view, are strongly affected by the number of species living in those habitats at earlier times.",
                "text_2": "In 2010, a group of researchers including biologist Carla Cáceres created artificial pools in a New York forest. They stocked some pools with a diverse mix of zooplankton species and others with a single zooplankton species and allowed the pool communities to develop naturally thereafter. Over the course of four years, Cáceres and colleagues periodically measured the species diversity of the pools, finding—contrary to their expectations—that by the end of the study there was little to no difference in the pools’ species diversity.",
                "question": "Based on the texts, how would Cáceres and colleagues (Text 2) most likely describe the view of the theorists presented in Text 1?",
                "options": [
                  { "A": "It is largely correct, but it requires a minor refinement in light of the research team’s results." },
                  { "B": "It is not compelling as a theory regardless of any experimental data collected by the research team." },
                  { "C": "It may seem plausible, but it is not supported by the research team’s findings." },
                  { "D": "It probably holds true only in conditions like those in the research team’s study." }
                ],
                "correct answer": "C",
                "skill_knowledge": "Cross-Text Connections",
                "key_explanation": "Choice C is the best answer. Text 2 indicates that Cáceres and colleagues expected to find at the end of their study that the pools they stocked with multiple zooplankton species would have greater diversity than the pools they stocked with a single zooplankton species but that this was not, in fact, the case.",
                "distractor_explanations": [
                  { "A": "Choice A is incorrect because the findings obtained by Cáceres and colleagues fundamentally challenge the hypothesis in Text 1 rather than largely support it." },
                  { "B": "Choice B is incorrect because 'contrary to their expectations' (Text 2) indicates that Cáceres and colleagues had assumed the hypothesis in Text 1 was correct prior to conducting their own study." },
                  { "D": "Choice D is incorrect because the findings obtained by Cáceres and colleagues undermine, rather than support, the hypothesis in Text 1." }
                ]
              }
        },
        {
          name: "Cross-Text Connections",
          description: "Students will draw reasonable connections between two texts on related topics.",
          "Example": {
              "text_1": "What factors influence the abundance of species in a given ecological community? Some theorists have argued that historical diversity is a major driver of how diverse an ecological community eventually becomes: differences in community diversity across otherwise similar habitats, in this view, are strongly affected by the number of species living in those habitats at earlier times.",
              "text_2": "In 2010, a group of researchers including biologist Carla Cáceres created artificial pools in a New York forest. They stocked some pools with a diverse mix of zooplankton species and others with a single zooplankton species and allowed the pool communities to develop naturally thereafter. Over the course of four years, Cáceres and colleagues periodically measured the species diversity of the pools, finding—contrary to their expectations—that by the end of the study there was little to no difference in the pools’ species diversity.",
              "question": "Based on the texts, how would Cáceres and colleagues (Text 2) most likely describe the view of the theorists presented in Text 1?",
              "options": [
                { "A": "It is largely correct, but it requires a minor refinement in light of the research team’s results." },
                { "B": "It is not compelling as a theory regardless of any experimental data collected by the research team." },
                { "C": "It may seem plausible, but it is not supported by the research team’s findings." },
                { "D": "It probably holds true only in conditions like those in the research team’s study." }
              ],
              "correct answer": "C",
              "skill_knowledge": "Cross-Text Connections",
              "key_explanation": "Choice C is the best answer. Text 2 indicates that Cáceres and colleagues expected to find at the end of their study that the pools they stocked with multiple zooplankton species would have greater diversity than the pools they stocked with a single zooplankton species but that this was not, in fact, the case.",
              "distractor_explanations": [
                { "A": "Choice A is incorrect because the findings obtained by Cáceres and colleagues fundamentally challenge the hypothesis in Text 1 rather than largely support it." },
                { "B": "Choice B is incorrect because 'contrary to their expectations' (Text 2) indicates that Cáceres and colleagues had assumed the hypothesis in Text 1 was correct prior to conducting their own study." },
                { "D": "Choice D is incorrect because the findings obtained by Cáceres and colleagues undermine, rather than support, the hypothesis in Text 1." }
              ]
            }
      }
        ]
    },
    {
        type: "Expression of Ideas",
        description: "Students will use revision skills and knowledge to improve the effectiveness of written expression in accordance with specified rhetorical goals.",
        subtypes: [
        {
            name: "Rhetorical Synthesis",
            description: "Students will strategically integrate information and ideas on a topic to form an effective sentence achieving a specified rhetorical aim.",
            "Example": {
                "notes": [
                  "Maika’i Tubbs is a Native Hawaiian sculptor and installation artist.",
                  "His work has been shown in the United States, Canada, Japan, and Germany, among other places.",
                  "Many of his sculptures feature discarded objects.",
                  "His work Erasure (2008) includes discarded audiocassette tapes and magnets.",
                  "His work Home Grown (2009) includes discarded pushpins, plastic plates and forks, and wood."
                ],
                "question": "The student wants to emphasize a similarity between the two works. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
                "options": [
                  { "A": "Erasure (2008) uses discarded objects such as audiocassette tapes and magnets; Home Grown (2009), however, includes pushpins, plastic plates and forks, and wood." },
                  { "B": "Like many of Tubbs’s sculptures, both Erasure and Home Grown include discarded objects: Erasure uses audiocassette tapes, and Home Grown uses plastic forks." },
                  { "C": "Tubbs’s work, which often features discarded objects, has been shown both within the United States and abroad." },
                  { "D": "Tubbs completed Erasure in 2008 and Home Grown in 2009." }
                ],
                "correct answer": "B",
                "skill_knowledge": "Rhetorical Synthesis",
                "key_explanation": "Choice B is the best answer. The sentence uses 'like many of Tubbs’s sculptures' and 'both' to emphasize a similarity between Erasure and Home Grown in terms of their common use of discarded objects, though the specific discarded objects used differed between the two works.",
                "distractor_explanations": [
                  { "A": "Choice A is incorrect because although the sentence discusses two of Tubbs’s works, the use of 'however' emphasizes a contrast, rather than a similarity, between the works." },
                  { "C": "Choice C is incorrect because the sentence focuses only on Tubbs’s work in general and does not mention any specific works." },
                  { "D": "Choice D is incorrect because the sentence simply conveys information about two of Tubbs’s works—the year in which each was completed—without establishing any sort of logical relationship between the pieces of information." }
                ]
              }
        },
        {
          name: "Rhetorical Synthesis",
          description: "Students will strategically integrate information and ideas on a topic to form an effective sentence achieving a specified rhetorical aim.",
          "Example": {
              "notes": [
                "Maika’i Tubbs is a Native Hawaiian sculptor and installation artist.",
                "His work has been shown in the United States, Canada, Japan, and Germany, among other places.",
                "Many of his sculptures feature discarded objects.",
                "His work Erasure (2008) includes discarded audiocassette tapes and magnets.",
                "His work Home Grown (2009) includes discarded pushpins, plastic plates and forks, and wood."
              ],
              "question": "The student wants to emphasize a similarity between the two works. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
              "options": [
                { "A": "Erasure (2008) uses discarded objects such as audiocassette tapes and magnets; Home Grown (2009), however, includes pushpins, plastic plates and forks, and wood." },
                { "B": "Like many of Tubbs’s sculptures, both Erasure and Home Grown include discarded objects: Erasure uses audiocassette tapes, and Home Grown uses plastic forks." },
                { "C": "Tubbs’s work, which often features discarded objects, has been shown both within the United States and abroad." },
                { "D": "Tubbs completed Erasure in 2008 and Home Grown in 2009." }
              ],
              "correct answer": "B",
              "skill_knowledge": "Rhetorical Synthesis",
              "key_explanation": "Choice B is the best answer. The sentence uses 'like many of Tubbs’s sculptures' and 'both' to emphasize a similarity between Erasure and Home Grown in terms of their common use of discarded objects, though the specific discarded objects used differed between the two works.",
              "distractor_explanations": [
                { "A": "Choice A is incorrect because although the sentence discusses two of Tubbs’s works, the use of 'however' emphasizes a contrast, rather than a similarity, between the works." },
                { "C": "Choice C is incorrect because the sentence focuses only on Tubbs’s work in general and does not mention any specific works." },
                { "D": "Choice D is incorrect because the sentence simply conveys information about two of Tubbs’s works—the year in which each was completed—without establishing any sort of logical relationship between the pieces of information." }
              ]
            }
      },
      {
        name: "Rhetorical Synthesis",
        description: "Students will strategically integrate information and ideas on a topic to form an effective sentence achieving a specified rhetorical aim.",
        "Example": {
            "notes": [
              "Maika’i Tubbs is a Native Hawaiian sculptor and installation artist.",
              "His work has been shown in the United States, Canada, Japan, and Germany, among other places.",
              "Many of his sculptures feature discarded objects.",
              "His work Erasure (2008) includes discarded audiocassette tapes and magnets.",
              "His work Home Grown (2009) includes discarded pushpins, plastic plates and forks, and wood."
            ],
            "question": "The student wants to emphasize a similarity between the two works. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
            "options": [
              { "A": "Erasure (2008) uses discarded objects such as audiocassette tapes and magnets; Home Grown (2009), however, includes pushpins, plastic plates and forks, and wood." },
              { "B": "Like many of Tubbs’s sculptures, both Erasure and Home Grown include discarded objects: Erasure uses audiocassette tapes, and Home Grown uses plastic forks." },
              { "C": "Tubbs’s work, which often features discarded objects, has been shown both within the United States and abroad." },
              { "D": "Tubbs completed Erasure in 2008 and Home Grown in 2009." }
            ],
            "correct answer": "B",
            "skill_knowledge": "Rhetorical Synthesis",
            "key_explanation": "Choice B is the best answer. The sentence uses 'like many of Tubbs’s sculptures' and 'both' to emphasize a similarity between Erasure and Home Grown in terms of their common use of discarded objects, though the specific discarded objects used differed between the two works.",
            "distractor_explanations": [
              { "A": "Choice A is incorrect because although the sentence discusses two of Tubbs’s works, the use of 'however' emphasizes a contrast, rather than a similarity, between the works." },
              { "C": "Choice C is incorrect because the sentence focuses only on Tubbs’s work in general and does not mention any specific works." },
              { "D": "Choice D is incorrect because the sentence simply conveys information about two of Tubbs’s works—the year in which each was completed—without establishing any sort of logical relationship between the pieces of information." }
            ]
          }
    },
        {
            name: "Transitions",
            description: "Students will determine the most effective transition word or phrase to logically connect information and ideas in a text.",
            "Example": {
                "text": [
                  "Iraqi artist Nazik Al-Malaika, celebrated as the first Arabic poet to write in free verse, didn’t reject traditional forms entirely; her poem “Elegy for a Woman of No Importance” consists of two ten-line stanzas and a standard number of syllables.",
                  "Even in this superficially traditional work, ______ Al-Malaika was breaking new ground by memorializing an anonymous woman rather than a famous man."
                ],
                "question": "Which choice completes the text with the most logical transition?",
                "options": [
                  { "A": "in fact," },
                  { "B": "though," },
                  { "C": "therefore," },
                  { "D": "moreover," }
                ],
                "correct answer": "B",
                "skill_knowledge": "Transitions",
                "key_explanation": "Choice B is the best answer. The passage’s first sentence establishes that although Al-Malaika is famous for her free verse poetry, she still made some use of traditional poetic forms, as in her work 'Elegy for a Woman of No Importance.' The passage’s last sentence qualifies the point made in the passage’s first sentence by indicating that even when Al-Malaika used traditional forms, as in 'Elegy,' she challenged tradition, in this case by making an 'anonymous woman rather than a famous man' the subject of the poem. 'Though' is the best transition for the passage’s last sentence because, along with 'even,' it signals that Al-Malaika subverted traditional poetic forms even when she used them by, in this case, using a nontraditional subject for an elegy.",
                "distractor_explanations": [
                  { "A": "Choice A is incorrect because 'in fact' illogically signals that the passage’s last sentence stresses or amplifies the truth of the assertion made in the passage’s first sentence." },
                  { "C": "Choice C is incorrect because 'therefore' illogically signals that the passage’s last sentence describes a consequence arising from the assertion made in the passage’s first sentence." },
                  { "D": "Choice D is incorrect because 'moreover' illogically signals that the passage’s last sentence merely offers additional information about the assertion made in the passage’s first sentence." }
                ]
              }
        },
        {
          name: "Transitions",
          description: "Students will determine the most effective transition word or phrase to logically connect information and ideas in a text.",
          "Example": {
              "text": [
                "Iraqi artist Nazik Al-Malaika, celebrated as the first Arabic poet to write in free verse, didn’t reject traditional forms entirely; her poem “Elegy for a Woman of No Importance” consists of two ten-line stanzas and a standard number of syllables.",
                "Even in this superficially traditional work, ______ Al-Malaika was breaking new ground by memorializing an anonymous woman rather than a famous man."
              ],
              "question": "Which choice completes the text with the most logical transition?",
              "options": [
                { "A": "in fact," },
                { "B": "though," },
                { "C": "therefore," },
                { "D": "moreover," }
              ],
              "correct answer": "B",
              "skill_knowledge": "Transitions",
              "key_explanation": "Choice B is the best answer. The passage’s first sentence establishes that although Al-Malaika is famous for her free verse poetry, she still made some use of traditional poetic forms, as in her work 'Elegy for a Woman of No Importance.' The passage’s last sentence qualifies the point made in the passage’s first sentence by indicating that even when Al-Malaika used traditional forms, as in 'Elegy,' she challenged tradition, in this case by making an 'anonymous woman rather than a famous man' the subject of the poem. 'Though' is the best transition for the passage’s last sentence because, along with 'even,' it signals that Al-Malaika subverted traditional poetic forms even when she used them by, in this case, using a nontraditional subject for an elegy.",
              "distractor_explanations": [
                { "A": "Choice A is incorrect because 'in fact' illogically signals that the passage’s last sentence stresses or amplifies the truth of the assertion made in the passage’s first sentence." },
                { "C": "Choice C is incorrect because 'therefore' illogically signals that the passage’s last sentence describes a consequence arising from the assertion made in the passage’s first sentence." },
                { "D": "Choice D is incorrect because 'moreover' illogically signals that the passage’s last sentence merely offers additional information about the assertion made in the passage’s first sentence." }
              ]
            }
      }
        ]
    },
    {
        type: "Standard English Conventions",
        description: "Students will use editing skills and knowledge to make text conform to core conventions of Standard English sentence structure, usage, and punctuation.",
        subtypes: [
        {
            name: "Between Sentences",
            description: "Students will use contextually appropriate punctuation to properly mark the end of a sentence.",
            
        },
        {
            name: "Within Sentences",
            description: "Students will coordinate clauses within a sentence or elements in a series using appropriate punctuation and, in some cases, a conjunction or conjunctive adverb; incorporate supplementary information (e.g., appositives, parentheticals) using appropriate punctuation; and recognize circumstances in which no punctuation is needed to set off sentence elements.",
            "Example": {
                "text": "According to Naomi Nakayama of the University of Edinburgh, the reason seeds from a dying dandelion appear to float in the air while ______ is that their porous plumes enhance drag, allowing the seeds to stay airborne long enough for the wind to disperse them throughout the surrounding area.",
                "question": "Which choice completes the text so that it conforms to the conventions of Standard English?",
                "options": [
                  { "A": "falling," },
                  { "B": "falling:" },
                  { "C": "falling;" },
                  { "D": "falling" }
                ],
                "correct answer": "D",
                "skill_knowledge": "Standard English Conventions",
                "key_explanation": "Choice D is the best answer. No punctuation is needed. The sentence structure requires no interruption between the subject ('the reason . . . falling') and the verb 'is.'",
                "distractor_explanations": [
                  { "A": "Choice A is incorrect because the comma unnecessarily separates the subject from the verb." },
                  { "B": "Choice B is incorrect because the colon is unnecessary and would disrupt the flow of the sentence." },
                  { "C": "Choice C is incorrect because the semicolon is not needed in this context." }
                ]
              }
        },
        // {
        //     name: "Subject-Verb Agreement",
        //     description: "Students will ensure agreement in number between a subject and a verb.",
        // },
        {
            name: "Pronoun-Antecedent Agreement",
            description: "Students will ensure agreement in number between a pronoun and its antecedent.",
        },
        {
            name: "Verb Finiteness",
            description: "Students will use verbs and verbals (i.e., gerunds, participles, infinitives) in contextually appropriate ways.",
        },
        {
            name: "Verb Tense and Aspect",
            description: "Students will use contextually appropriate tenses and aspects of verbs.",
        },
        {
            name: "Subject-Modifier Placement",
            description: "Students will place modifying elements in sentences (e.g., participles) in contextually appropriate ways.",
        },
        {
            name: "Genitives and Plurals",
            description: "Students will make contextually appropriate choices among singular, plural, singular possessive, and plural possessive nouns and pronouns and among possessive determiners (its, their, your), contractions (it’s, they’re, you’re), and adverbs (there).",
        }
        ]
    }
    ]
};


  try {
    for (const parent of questionData.questions) {
      for (const subtype of parent.subtypes) {
        // Step 2: Generate a question using OpenAI GPT
        const exampleText = subtype.Example ? 
          ` Example: ${JSON.stringify(subtype.Example)}` : '';
        
        const prompt = `Create a question for the type "${parent.type}" and subtype "${subtype.name}". Description: ${subtype.description}.${exampleText}`;
        
        // Log the prompt to see what is being sent to ChatGPT
        console.log("Prompt for ChatGPT:", prompt);
        
        const questionData = await generateQuestion(prompt);

        // Step 3: Upload the generated question and options to Supabase
        await uploadToSupabase(questionData);
      }
    }

    console.log("Pipeline completed successfully!");
  } catch (error) {
    console.error("Error in pipeline:", error.message);
  }
}

// Run the pipeline
main().catch((error) => {
  console.error("Error running pipeline:", error);
});
