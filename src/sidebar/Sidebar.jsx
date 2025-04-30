import React, { useState } from 'react';
import { connect } from 'react-redux';
import { accountSettingsPageSelector } from '../account-settings/data/selectors';

const Sidebar = ({ fullName, username }) => { 
  const [isInstructor, setIsInstructor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const [activeLink, setActiveLink] = useState(window.location.pathname);
  
  return (
    <aside className="z-50 hidden xl:block xl:fixed xl:h-screen bg-white w-auto min-w-[256px] max-w-[15%] px-3.5 py-9 shadow-sm hover:overflow-y-auto">
      <div className="w-full flex flex-col">
        <div>         
          <div className="w-full flex justify-center">
            <div
              className="rounded-full flex items-center justify-center size-28 border-4 border-main bg-center object-cover"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className='size-28'  viewBox="0 0 32 32"><path fill="none" d="M8.007 24.93A4.996 4.996 0 0 1 13 20h6a4.996 4.996 0 0 1 4.993 4.93a11.94 11.94 0 0 1-15.986 0M20.5 12.5A4.5 4.5 0 1 1 16 8a4.5 4.5 0 0 1 4.5 4.5"/><path fill="currentColor" d="M26.749 24.93A13.99 13.99 0 1 0 2 16a13.9 13.9 0 0 0 3.251 8.93l-.02.017c.07.084.15.156.222.239c.09.103.187.2.28.3q.418.457.87.87q.14.124.28.242q.48.415.99.782c.044.03.084.069.128.1v-.012a13.9 13.9 0 0 0 16 0v.012c.044-.031.083-.07.128-.1q.51-.368.99-.782q.14-.119.28-.242q.451-.413.87-.87c.093-.1.189-.197.28-.3c.071-.083.152-.155.222-.24ZM16 8a4.5 4.5 0 1 1-4.5 4.5A4.5 4.5 0 0 1 16 8M8.007 24.93A4.996 4.996 0 0 1 13 20h6a4.996 4.996 0 0 1 4.993 4.93a11.94 11.94 0 0 1-15.986 0"/></svg>
            </div>
          </div>

          <div className="text-center mt-3 space-y-2">
            <h3 className="font-semibold text-base text-dim-black">
              {fullName}
            </h3>
            <h3 className="text-sm font-semibold text-black">
              Public Username: <span className="font-medium">{username}</span>
            </h3>
          </div>

          <div className="mt-7 q-full flex justify-center">
            {!isInstructor ? (
              <a
                href="mycourse.html"
                className="w-[150px] py-2 px-4 text-base font-medium bg-cFF0 text-white rounded-lg"
              >
                My Courses
              </a>
            ) : (
              <a
                href="mycourseins.html"
                className="w-[150px] py-2 px-4 text-base font-medium bg-cFF0 text-white rounded-lg"
              >
                View Courses
              </a>
            )}
          </div>
        </div>

        <nav className="mt-12 font-inter flex-grow flex flex-col justify-between">
          <ul className="space-y-6">
            <li>
              <a
                href="dashboard.html"
                className={`w-full py-2.5 px-3 flex items-center space-x-2 rounded-lg ${
                  activeLink.includes('dashboard.html') ? 'bg-main' : ''
                }`}
              >
                <img src="../asset/grid.svg" alt="" />
                <span className='dimBlack text-base font-inter'>Dashboard</span>
              </a>
            </li>

            {!isInstructor && (
              <li>
                <a
                  href="certificate.html"
                  className={`w-full py-2.5 px-3 flex items-center space-x-2 rounded-lg ${
                    activeLink.includes('certificate.html') ? 'bg-main' : ''
                  }`}
                >
                  <img src="../asset/certificate.svg" alt="" />
                  <span className='dimBlack text-base font-inter'>Certificate</span>
                </a>
              </li>
            )}

            {isInstructor && (
              <li>
                <a
                  href="discussionins.html"
                  className={`w-full py-2.5 px-3 flex items-center space-x-2 rounded-lg ${
                    activeLink.includes('discussionins.html') ? 'bg-main' : ''
                  }`}
                >
                  <img src="../asset/dis.svg" alt="" />
                  <span className='dimBlack text-base font-inter'>Discussion</span>
                </a>
              </li>
            )}

            <li>
              <a
                href="account.html"
                className={`w-full py-2.5 px-3 flex items-center space-x-2 rounded-lg ${
                  activeLink.includes('account.html') ? 'bg-main' : ''
                }`}
              >
                <img src="../asset/slider.svg" alt="" />
                <span className='dimBlack text-base font-inter'>Account</span>
              </a>
            </li>

            <li>
              <a
                href="notification.html"
                className={`w-full py-2.5 px-3 flex items-center space-x-2 rounded-lg ${
                  activeLink.includes('notification.html') ? 'bg-main' : ''
                }`}
              >
                <img src="../asset/bell.svg" alt="" />
                <span className='dimBlack text-base font-inter'>Notification</span>
              </a>
            </li>
            
            {isAdmin && (
              <div className="flex  space-x-2 px-3">
                <label className="relative flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={isInstructor}
                    onChange={() => setIsInstructor(!isInstructor)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 rounded-full peer-checked:bg-dimBlack transition relative">
                    <div
                      className={`bg-white absolute left-1 top-1 w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${
                        isInstructor ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    ></div>
                  </div>
                </label>
                <span className="dimBlack text-base font-inter">Instructor Mode</span>
              </div>
            )}
          </ul>
          <div className="w-full py-6 mt-10 2xl:mt-16">
            <div>
              <button className="w-full flex items-center space-x-2 px-3">
                <img src="../asset/logout.svg" alt="" />
                <span className='dimBlack text-base font-inter'>Log Out</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

const mapStateToProps = (state) => ({
  username: accountSettingsPageSelector(state).formValues.username,
  fullName: accountSettingsPageSelector(state).formValues.name,
});

export default connect(mapStateToProps)(Sidebar);