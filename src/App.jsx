import { ethers } from "ethers";
import { useState, useEffect } from "react";
import abi from "./TFFactory.json";
import farmAbi from "./TradeFarmingAVAX.json";
import tokenAbi from "./ERC20.json";

export default function App() {
  const [signer, setSigner] = useState({});
  const [pending, setPending] = useState(false);
  const [data, setData] = useState({
    routerAddress: "",
    tokenAddress: "",
    rewardTokenAddress: "",
    previousVolume: "100",
    previousDays: "1",
    totalDays: "",
    upLimit: "100",
    downLimit: "100",
    amount: "",
    farmAddress: "",
  });

  const [createdContracts, setCreatedContracts] = useState("");

  async function connectWallet() {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const account = provider.getSigner();
      setSigner(account);
      await switchNetwork();
    } else {
      alert("Please install metamask");
    }
  }

  async function switchNetwork() {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xA86A" }],
    });
  }

  async function createNewFarm() {
    try {
      if (signer._isSigner) {
        await switchNetwork();
        const tfFactory = new ethers.Contract(
          "0xe41E99D39E84Ec080244E1aA5aB15E1b1d708618",
          abi.abi,
          signer
        );
        const {
          routerAddress,
          tokenAddress,
          rewardTokenAddress,
          previousVolume,
          previousDays,
          totalDays,
          upLimit,
          downLimit,
        } = data;
        const newTF = await tfFactory.newFarm(
          routerAddress,
          tokenAddress,
          rewardTokenAddress,
          ethers.utils.parseEther(previousVolume),
          previousDays,
          totalDays,
          upLimit,
          downLimit
        );
        setPending(true);
        await newTF.wait();
        setPending(false);
        await listContracts();
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function listContracts() {
    if (signer._isSigner) {
      const accountAddress = await signer.getAddress();
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const tfFactory = new ethers.Contract(
        "0xe41E99D39E84Ec080244E1aA5aB15E1b1d708618",
        abi.abi,
        provider
      );
      const filterFrom = tfFactory.filters.NewContractCreated(
        accountAddress,
        null
      );
      const blockNumber = await provider.getBlockNumber();
      const pastBlock = blockNumber - 2048;
      const allContracts = await tfFactory.queryFilter(
        filterFrom,
        pastBlock,
        blockNumber
      );
      const lastContract = allContracts[allContracts.length - 1].args[1];
      await setCreatedContracts(lastContract);
      await setData((prev) => ({ ...prev, farmAddress: lastContract }));
    }
  }

  async function getAllowance() {
    try {
      if (signer._isSigner) {
        const address = await signer.getAddress();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const rewToken = new ethers.Contract(
          data.rewardTokenAddress,
          tokenAbi,
          provider
        );
        const checkAllowance = await rewToken.allowance(
          address,
          data.farmAddress
        );
        return ethers.utils.formatEther(checkAllowance.toString());
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function depositReward() {
    try {
      if (signer._isSigner) {
        const totalAllowed = await getAllowance();
        if (parseInt(totalAllowed) < parseInt(data.amount)) {
          const rewToken = new ethers.Contract(
            data.rewardTokenAddress,
            tokenAbi,
            signer
          );
          const approveTxn = await rewToken.approve(
            data.farmAddress,
            ethers.utils.parseEther("500000")
          );
          await approveTxn.wait();
        }
        const myFarm = new ethers.Contract(
          data.farmAddress,
          farmAbi.abi,
          signer
        );
        const depositTxn = await myFarm.depositRewardTokens(
          ethers.utils.parseEther(data.amount)
        );
        await depositTxn.wait();
      }
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div className="App">
      <div>
        <h2>PERA FINANCE ADMIN PAGE</h2>
        <button onClick={connectWallet} className="connect">
          {signer._isSigner ? "Connected" : "Connect/Switch"}
        </button>
      </div>
      <div className="newContract">
        <select
          name="dex"
          id="dex"
          onChange={(e) =>
            setData((prev) => ({ ...prev, routerAddress: e.target.value }))
          }
        >
          <option value="">-DEX-</option>
          <option value="0xe54ca86531e17ef3616d22ca28b0d458b6c89106">
            Pangolin
          </option>
          <option value="0x60ae616a2155ee3d9a68541ba4544862310933d4">
            TraderJoe
          </option>
        </select>

        <select
          name="tokenAddress"
          id="tokenAddress"
          onChange={(e) =>
            setData((prev) => ({ ...prev, tokenAddress: e.target.value }))
          }
        >
          <option value="">-Pair-</option>
          <option value="0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E">
            USDC / AVAX
          </option>
          <option value="0xfDA866CFEcE71F4C17b4a5e5f9A00ac08C72Eadc">
            PERA / AVAX
          </option>
          <option value="0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd">
            JOE / AVAX
          </option>
          <option value="0x60781C2586D68229fde47564546784ab3fACA982">
            PNG / AVAX
          </option>
          <option value="0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7">
            USDT / AVAX
          </option>
          <option value="0x846D50248BAf8b7ceAA9d9B53BFd12d7D7FBB25a">
            VSO / AVAX
          </option>
        </select>

        <select
          name="rewardAddress"
          id="rewardAddress"
          onChange={(e) =>
            setData((prev) => ({ ...prev, rewardTokenAddress: e.target.value }))
          }
        >
          <option value="">-Reward Token-</option>
          <option value="0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E">
            USDC
          </option>
          <option value="0xfDA866CFEcE71F4C17b4a5e5f9A00ac08C72Eadc">
            PERA
          </option>
          <option value="0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd">
            JOE
          </option>
          <option value="0x60781C2586D68229fde47564546784ab3fACA982">
            PNG
          </option>
          <option value="0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7">
            USDT
          </option>
          <option value="0x846D50248BAf8b7ceAA9d9B53BFd12d7D7FBB25a">
            VSO
          </option>
        </select>
        <input
          type="text"
          name="totalDays"
          placeholder="Total Days"
          onChange={(e) =>
            setData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
          }
          value={data.totalDays}
        />
        <button onClick={createNewFarm}>Create New Farm!</button>
        {pending && <p>Creating your swap farm...</p>}
        {createdContracts && (
          <p>
            Please copy and save the address of your farm contract:{" "}
            {createdContracts}
          </p>
        )}
      </div>
      <div className="manageContract">
        <input
          type="text"
          onChange={(e) =>
            setData((prev) => ({ ...prev, farmAddress: e.target.value }))
          }
          value={data.farmAddress}
          placeholder="Contract Address"
        />
        <input
          type="text"
          onChange={(e) =>
            setData((prev) => ({ ...prev, amount: e.target.value }))
          }
          value={data.amount}
          placeholder="Amount"
        />
        <select
          name="rewardAddress"
          id="rewardAddress"
          onChange={(e) =>
            setData((prev) => ({ ...prev, rewardTokenAddress: e.target.value }))
          }
        >
          <option value="">-Reward Token to Deposit-</option>
          <option value="0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E">
            USDC
          </option>
          <option value="0xfDA866CFEcE71F4C17b4a5e5f9A00ac08C72Eadc">
            PERA
          </option>
          <option value="0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd">
            JOE
          </option>
          <option value="0x60781C2586D68229fde47564546784ab3fACA982">
            PNG
          </option>
          <option value="0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7">
            USDT
          </option>
          <option value="0x846D50248BAf8b7ceAA9d9B53BFd12d7D7FBB25a">
            VSO
          </option>
        </select>
        <button onClick={depositReward}>Deposit Reward!</button>
      </div>
    </div>
  );
}
