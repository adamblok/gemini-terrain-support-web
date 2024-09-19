import {AzureOpenAI} from 'openai';
import {useState} from "react";
import Markdown from 'react-markdown'

function App() {
  const [state, setState] = useState({});

  const setMessage = (e) => {
    setState({
      description: e.target.value,
    })
  };

  const submit = async () => {
    if (state.isLoading) {
      return;
    }

    setState({
      isLoading: true
    });
    const newState = {
      isLoading: false
    };

    try {
      const endpoint = 'https://hackweek-case5.openai.azure.com';
      const azureSearchEndpoint = 'https://search-case5.search.windows.net';
      const azureSearchIndexName = 'search-case5-index-demo';
      const deployment = 'gpt-4o-mini';
      const apiVersion = '2024-05-01-preview';
      const client = new AzureOpenAI({
        apiKey: '27dbf02059644e64b2d869a68db8c82d',
        dangerouslyAllowBrowser: true,
        deployment,
        apiVersion,
        endpoint
      });
      const events = await client.chat.completions.create({
        stream: false,
        messages: [
          {
            role: 'system',
            content: 'You are a support person in Volue Technology that helps people find answers to questions and problems they have with the Gemini Terrain. Give the answer in the language asked and take information from all documents available no matter what language it is in.'
          },
          {
            role: 'user',
            content: 'I am a user of Terrain or a potential customer'
          },
          {
            role: 'user',
            content: state.description,
          },
        ],
        temperature: 0,
        top_p: 1,
        max_tokens: 1024,
        data_sources: [
          {
            type: 'azure_search',
            parameters: {
              endpoint: azureSearchEndpoint,
              index_name: azureSearchIndexName,
              authentication: {
                type: 'api_key',
                key: 'lF35nyWKIgf1LoM91TtxZfLqJ9QUl9lnfnbglio1YiAzSeBon1Vw'
              },
            },
          },
        ],
      });

      const response = events?.choices[0]?.message?.content || '';

      if (response.length > 0 && !response.includes('Please try another query or topic') &&
          !response.includes('Vennligst prøv et annet spørsmål eller tema')) {
        newState.response = response.replaceAll(/\s*\[doc\d+]/gi, '');
      } else {
        newState.sent = true;
      }
    } catch (e) {
      console.error(e);
    }

    setState(newState);
  }

  const renderResponse = () => {
    return (
        <div className="response">
          <h3>Does this answer your question?</h3>
          <Markdown>
            {state.response}
          </Markdown>
          <div>
            <button className="" onClick={() => setState({responseAccepted: true})}>Yes, that's it!</button>
            &nbsp;&nbsp;
            <button className="outline" onClick={() => setState({sent: true})}>No, I still need help</button>
            {state.isLoading && <span className="inlineSpinner"></span>}
          </div>
        </div>
    );
  }

  const renderForm = () => {
    return (
        <div className="form">
          <div>
            <label>Your e-mail:</label>
            <input type="text" name=""/>
          </div>
          <div>
            <label>Message:</label>
            <textarea rows="5" onChange={setMessage}></textarea>
          </div>
          <div>
            <button onClick={submit}>Submit</button>
            {state.isLoading && <span className="inlineSpinner"></span>}
          </div>
        </div>
    );
  }

  const renderSent = () => {
    return (
        <div className="confirmation">
          <h3>Your message has been sent</h3>
          <p>
            We will respond to your message as soon as possible.
          </p>
          <p>
            <a href="/">Return to home page</a>
          </p>
        </div>
    );
  }

  const renderResponseAccepted = () => {
    return (
        <div className="confirmation">
          <h3>We are glad that your issue has been resolved!</h3>
          <p>
            If you need assistance, feel free to reach out to us anytime.
          </p>
          <p>
            <a href="/">Return to home page</a>
          </p>
        </div>
    );
  }

  return (
      <div>
      <h2>Report an Issue</h2>
        {state.response && renderResponse()}
        {state.responseAccepted && renderResponseAccepted()}
        {state.sent && renderSent()}
        {!state.response && !state.sent && !state.responseAccepted && renderForm()}
      </div>
  )
}

export default App
