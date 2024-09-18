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
      const endpoint = 'https://hackweek-case5.openai.azure.com/';
      const azureSearchEndpoint = 'https://search-case5.search.windows.net';
      const azureSearchIndexName = 'kaare-og-adam-filer2';
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
        stream: true,
        messages: [
          {
            role: 'user',
            content: state.description,
          },
        ],
        max_tokens: 512,
        model: '',
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

      const reader = events.toReadableStream().getReader();
      const decoder = new TextDecoder();
      let response = '';

      while (true) {
        const {done, value} = await reader.read();

        if (done) {
          break;
        }

        const json = decoder.decode(value, { stream: true });
        const data = JSON.parse(json);

        response += data?.choices[0]?.delta?.content || '';

        console.log(data?.choices[0]?.delta?.content);
      }

      if (response.length > 0 && !response.includes('try another query or topic')) {
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
